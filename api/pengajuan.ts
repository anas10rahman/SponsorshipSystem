import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  sql,
  assembleState,
  readBody,
  SUBMISSION_FEE,
  REJECT_ADMIN_FEE,
  REJECT_REFUND,
} from "./_db.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Normalisasi satu poin detail permintaan. Toleran data lama (string → in_kind).
   Kembalikan null bila poin kosong (in_cash tanpa nominal / in_kind tanpa spec). */
function normalizeRequest(r: any): any | null {
  if (typeof r === "string") {
    const s = r.trim();
    return s ? { type: "in_kind", amount: 0, spec: s } : null;
  }
  if (r && r.type === "in_cash") {
    const a = Number(r.amount) || 0;
    return a > 0 ? { type: "in_cash", amount: a, spec: "" } : null;
  }
  if (r && r.type === "in_kind") {
    const s = String(r.spec || "").trim();
    return s ? { type: "in_kind", amount: 0, spec: s } : null;
  }
  return null;
}

/* Nominal paket = jumlah seluruh poin in_cash (toleran `amount` legacy). */
function packageAmount(pk: any): number {
  const reqs = Array.isArray(pk?.requests) ? pk.requests : [];
  const sum = reqs.reduce(
    (s: number, r: any) =>
      s + (r && typeof r === "object" && r.type === "in_cash" ? Number(r.amount) || 0 : 0),
    0,
  );
  return sum > 0 ? sum : Number(pk?.amount) || 0;
}

/* Normalisasi paket agar aman disimpan ke JSONB. */
function cleanPackages(packages: any): any[] {
  return (Array.isArray(packages) ? packages : [])
    .filter((pk: any) => (pk?.name || "").trim())
    .map((pk: any) => ({
      name: String(pk.name),
      requests: (Array.isArray(pk.requests) ? pk.requests : [])
        .map(normalizeRequest)
        .filter(Boolean),
      benefits: (Array.isArray(pk.benefits) ? pk.benefits : [])
        .map((s: any) => String(s).trim())
        .filter(Boolean),
    }));
}

/* Bangun query upsert pengajuan (dipakai save & submit). */
/* Gabungkan dokumen masuk dengan yang tersimpan: poin tanpa `data` (mis. saat
   edit draf tanpa unggah ulang) mempertahankan data lama berdasarkan nama.
   Hanya dokumen yang akhirnya punya data yang disimpan. */
async function resolveDocuments(id: string, incoming: any): Promise<any[]> {
  const docs = Array.isArray(incoming) ? incoming : [];
  const prev = (await sql`select documents from pengajuan where id = ${id} limit 1`) as any[];
  const stored: any[] = Array.isArray(prev[0]?.documents) ? prev[0].documents : [];
  const byName = new Map<string, string>();
  for (const d of stored) if (d?.name && d?.data) byName.set(String(d.name), String(d.data));
  return docs
    .filter((d: any) => (d?.name || "").trim())
    .map((d: any) => ({
      name: String(d.name),
      data: d?.data ? String(d.data) : byName.get(String(d.name)) ?? null,
    }))
    .filter((d: any) => d.data);
}

/* Bangun query upsert pengajuan. `documents` sudah di-resolve (dengan data). */
function upsertPengajuan(p: any, status: string, revisionNote: string | null, documents: any[]) {
  const packages = JSON.stringify(cleanPackages(p.packages));
  const docsJson = JSON.stringify(documents);
  const firstName = documents[0]?.name ?? null; // fallback tampilan legacy
  return sql`
    insert into pengajuan
      (id, org_id, funder_id, event_name, event_location, event_date, description,
       event_budget, packages, selected_package, documents, proposal_doc_url,
       extra_note, status, revision_note)
    values
      (${p.id}, ${p.orgId}, ${p.funderId}, ${p.eventName}, ${p.eventLocation},
       ${p.eventDate || null}, ${p.description}, ${p.eventBudget}, ${packages}::jsonb,
       ${p.selectedPackage ?? null}, ${docsJson}::jsonb, ${firstName},
       ${p.extraNote ?? null}, ${status}, ${revisionNote})
    on conflict (id) do update set
      event_name = excluded.event_name, event_location = excluded.event_location,
      event_date = excluded.event_date, description = excluded.description,
      event_budget = excluded.event_budget, packages = excluded.packages,
      selected_package = excluded.selected_package,
      documents = excluded.documents, proposal_doc_url = excluded.proposal_doc_url,
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
      const docs = await resolveDocuments(p.id, p.documents);
      const tx = [upsertPengajuan(p, p.status || "draf", p.revisionNote ?? null, docs)];
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
      const docs = await resolveDocuments(p.id, p.documents);
      const tx: any[] = [upsertPengajuan(p, "diajukan", null, docs), histQ(p.id, action, "Organisasi", note)];
      if (isFirst) tx.push(sql`update organizations set balance = greatest(0, balance - ${SUBMISSION_FEE}) where id = ${p.orgId}`);
      tx.push(auditQ(b.actorId, "pengajuan.diajukan", p.id, { packages: cleanPackages(p.packages).length }));
      const fUser = await userIdForFunder(p.funderId);
      if (fUser) tx.push(notifQ(fUser, "pengajuan.diajukan", `Pengajuan baru "${p.eventName}" menunggu tinjauan Anda.`));
      await sql.transaction(tx);
    } else if (op === "approve") {
      const p = await getPengajuan(b.id);
      if (p.status === "disetujui" || p.status === "ditolak")
        throw new HttpError(400, "Pengajuan sudah diputuskan.");
      const packages = Array.isArray(p.packages) ? p.packages : [];
      const idx = Number(b.selectedPackage);
      if (!Number.isInteger(idx) || idx < 0 || idx >= packages.length)
        throw new HttpError(400, "Pilih paket sponsorship yang ingin didanai dulu.");
      const chosen = packages[idx];
      const amount = packageAmount(chosen);
      const tx: any[] = [
        sql`update pengajuan set status = 'disetujui', selected_package = ${idx}, updated_at = now() where id = ${b.id}`,
        histQ(
          b.id,
          "Disetujui pendana",
          "Pendana",
          `Pendana menyetujui paket "${chosen?.name ?? ""}". Kesepakatan final. Biaya pengajuan Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} menjadi biaya admin (tidak dikembalikan).`,
        ),
        auditQ(b.actorId, "pengajuan.disetujui", b.id, { amount, package: chosen?.name ?? "", adminFee: SUBMISSION_FEE, refund: 0 }),
      ];
      if (amount > 0)
        tx.push(sql`update funders set budget_remaining = greatest(0, budget_remaining - ${amount}) where id = ${p.funder_id}`);
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.disetujui", `Pengajuan "${p.event_name}" disetujui pendana. Biaya pengajuan Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} menjadi biaya admin.`));
      await sql.transaction(tx);
    } else if (op === "reject") {
      const p = await getPengajuan(b.id);
      if (p.status === "disetujui" || p.status === "ditolak")
        throw new HttpError(400, "Pengajuan sudah diputuskan.");
      const note = (b.note || "").trim() || "Pendana menolak pengajuan.";
      const tx: any[] = [
        sql`update pengajuan set status = 'ditolak', updated_at = now() where id = ${b.id}`,
        histQ(b.id, "Ditolak pendana", "Pendana", `${note} Biaya admin Rp ${REJECT_ADMIN_FEE.toLocaleString("id-ID")} ditahan; Rp ${REJECT_REFUND.toLocaleString("id-ID")} dikembalikan ke saldo organisasi.`),
        auditQ(b.actorId, "pengajuan.ditolak", b.id, { adminFee: REJECT_ADMIN_FEE, refund: REJECT_REFUND }),
        // Tolak → kembalikan sisa biaya (dikurangi biaya admin) ke saldo organisasi.
        sql`update organizations set balance = balance + ${REJECT_REFUND} where id = ${p.org_id}`,
      ];
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.ditolak", `Pengajuan "${p.event_name}" ditolak pendana. Rp ${REJECT_REFUND.toLocaleString("id-ID")} dikembalikan ke saldo (biaya admin Rp ${REJECT_ADMIN_FEE.toLocaleString("id-ID")}).`));
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
