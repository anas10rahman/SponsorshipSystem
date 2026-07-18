import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody, SUBMISSION_FEE } from "./_db.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Normalisasi paket agar aman disimpan ke JSONB. */
function cleanPackages(packages: any): any[] {
  return (Array.isArray(packages) ? packages : [])
    .filter((pk: any) => (pk?.name || "").trim())
    .map((pk: any) => ({
      name: String(pk.name),
      amount: Number(pk.amount) || 0,
      requests: (Array.isArray(pk.requests) ? pk.requests : [])
        .map((s: any) => String(s).trim())
        .filter(Boolean),
      benefits: (Array.isArray(pk.benefits) ? pk.benefits : [])
        .map((s: any) => String(s).trim())
        .filter(Boolean),
    }));
}

/* Bangun query upsert pengajuan (dipakai save & submit). */
function upsertPengajuan(p: any, status: string, revisionNote: string | null) {
  const packages = JSON.stringify(cleanPackages(p.packages));
  return sql`
    insert into pengajuan
      (id, org_id, funder_id, event_name, event_location, event_date, description,
       event_budget, packages, selected_package, proposal_doc_url, proposal_doc_data,
       extra_note, status, revision_note)
    values
      (${p.id}, ${p.orgId}, ${p.funderId}, ${p.eventName}, ${p.eventLocation},
       ${p.eventDate || null}, ${p.description}, ${p.eventBudget}, ${packages}::jsonb,
       ${p.selectedPackage ?? null}, ${p.proposalDocUrl ?? null},
       ${p.proposalDocData ?? null}, ${p.extraNote ?? null}, ${status}, ${revisionNote})
    on conflict (id) do update set
      event_name = excluded.event_name, event_location = excluded.event_location,
      event_date = excluded.event_date, description = excluded.description,
      event_budget = excluded.event_budget, packages = excluded.packages,
      selected_package = excluded.selected_package,
      proposal_doc_url = excluded.proposal_doc_url,
      proposal_doc_data = coalesce(excluded.proposal_doc_data, pengajuan.proposal_doc_data),
      extra_note = excluded.extra_note, status = excluded.status,
      revision_note = excluded.revision_note, updated_at = now()`;
}

const histQ = (id: string, action: string, actor: string, note: string) =>
  sql`insert into pengajuan_history (pengajuan_id, action, actor, note)
      values (${id}, ${action}, ${actor}, ${note})`;

const auditQ = (actorId: string | null, action: string, entityId: string, meta: any = {}) =>
  sql`insert into audit_logs (actor_id, action, entity, entity_id, meta)
      values (${actorId || null}, ${action}, 'pengajuan', ${entityId}, ${JSON.stringify(meta)}::jsonb)`;

const notifQ = (userId: string, type: string, message: string) =>
  sql`insert into notifications (user_id, type, message) values (${userId}, ${type}, ${message})`;

async function userIdForFunder(funderId: string): Promise<string | null> {
  const r = (await sql`select id from users where funder_id = ${funderId} limit 1`) as any[];
  return r[0]?.id ?? null;
}
async function userIdForOrg(orgId: string): Promise<string | null> {
  const r = (await sql`select id from users where org_id = ${orgId} limit 1`) as any[];
  return r[0]?.id ?? null;
}
async function getPengajuan(id: string): Promise<any> {
  const r = (await sql`select * from pengajuan where id = ${id} limit 1`) as any[];
  if (!r.length) throw new HttpError(404, "Pengajuan tidak ditemukan.");
  return r[0];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    const op = b.op as string;

    if (op === "save") {
      const p = b.pengajuan;
      const existing = (await sql`select id from pengajuan where id = ${p.id} limit 1`) as any[];
      const tx = [upsertPengajuan(p, p.status || "draf", p.revisionNote ?? null)];
      if (!existing.length) tx.push(histQ(p.id, "Pengajuan dibuat", "Organisasi", "Draf pengajuan disimpan."));
      await sql.transaction(tx);
    } else if (op === "submit") {
      const p = b.pengajuan;
      const existing = (await sql`select status from pengajuan where id = ${p.id} limit 1`) as any[];
      const isFirst = !existing.length || existing[0].status === "draf";
      if (isFirst) {
        const bal = (await sql`select balance from organizations where id = ${p.orgId} limit 1`) as any[];
        if (Number(bal[0]?.balance ?? 0) < SUBMISSION_FEE)
          throw new HttpError(400, `Saldo tidak cukup untuk biaya pengajuan Rp ${SUBMISSION_FEE.toLocaleString("id-ID")}.`);
      }
      const action = existing[0]?.status === "perlu_revisi" ? "Diajukan ulang" : "Diajukan ke pendana";
      const note = isFirst
        ? `Pengajuan dikirim ke pendana. Biaya pengajuan ${SUBMISSION_FEE.toLocaleString("id-ID")} dipotong dari saldo.`
        : "Pengajuan dikirim ke pendana untuk ditinjau.";
      const tx: any[] = [upsertPengajuan(p, "diajukan", null), histQ(p.id, action, "Organisasi", note)];
      if (isFirst) tx.push(sql`update organizations set balance = greatest(0, balance - ${SUBMISSION_FEE}) where id = ${p.orgId}`);
      tx.push(auditQ(b.actorId, "pengajuan.diajukan", p.id, { packages: cleanPackages(p.packages).length }));
      const fUser = await userIdForFunder(p.funderId);
      if (fUser) tx.push(notifQ(fUser, "pengajuan.diajukan", `Pengajuan baru "${p.eventName}" menunggu tinjauan Anda.`));
      await sql.transaction(tx);
    } else if (op === "approve") {
      const p = await getPengajuan(b.id);
      const packages = Array.isArray(p.packages) ? p.packages : [];
      const idx = Number(b.selectedPackage);
      if (!Number.isInteger(idx) || idx < 0 || idx >= packages.length)
        throw new HttpError(400, "Pilih paket sponsorship yang ingin didanai dulu.");
      const chosen = packages[idx];
      const amount = Number(chosen?.amount) || 0;
      const tx: any[] = [
        sql`update pengajuan set status = 'disetujui', selected_package = ${idx}, updated_at = now() where id = ${b.id}`,
        histQ(
          b.id,
          "Disetujui pendana",
          "Pendana",
          `Pendana menyetujui paket "${chosen?.name ?? ""}" (Rp ${amount.toLocaleString("id-ID")}). Kesepakatan final.`,
        ),
        auditQ(b.actorId, "pengajuan.disetujui", b.id, { amount, package: chosen?.name ?? "" }),
      ];
      if (amount > 0)
        tx.push(sql`update funders set budget_remaining = greatest(0, budget_remaining - ${amount}) where id = ${p.funder_id}`);
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.disetujui", `Pengajuan "${p.event_name}" disetujui pendana (paket ${chosen?.name ?? ""}).`));
      await sql.transaction(tx);
    } else if (op === "reject") {
      const p = await getPengajuan(b.id);
      const note = (b.note || "").trim() || "Pendana menolak pengajuan.";
      const tx: any[] = [
        sql`update pengajuan set status = 'ditolak', updated_at = now() where id = ${b.id}`,
        histQ(b.id, "Ditolak pendana", "Pendana", note),
        auditQ(b.actorId, "pengajuan.ditolak", b.id),
      ];
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.ditolak", `Pengajuan "${p.event_name}" ditolak pendana.`));
      await sql.transaction(tx);
    } else if (op === "feedback") {
      const p = await getPengajuan(b.id);
      const note = (b.note || "").trim() || "Pendana meminta revisi.";
      const tx: any[] = [
        sql`update pengajuan set status = 'perlu_revisi', revision_note = ${note}, updated_at = now() where id = ${b.id}`,
        histQ(b.id, "Diminta revisi", "Pendana", note),
        auditQ(b.actorId, "pengajuan.revisi", b.id),
      ];
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.revisi", `Pengajuan "${p.event_name}" perlu direvisi.`));
      await sql.transaction(tx);
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }

    res.status(200).json(await assembleState());
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
