import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  sql,
  assembleState,
  readBody,
  SUBMISSION_FEE,
  REJECT_ADMIN_FEE,
  REJECT_REFUND,
} from "./_db.js";
import { AuthError, requireAuth, requireAdmin, requireOrg, requireFunder } from "./_auth.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Batas diam mitra sponsor sebelum pengajuan otomatis dibatalkan. */
const EXPIRE_DAYS = 7;

/* Auto-batal: pengajuan berstatus `diajukan` yang tidak direspons mitra sponsor
   selama EXPIRE_DAYS hari → status `kadaluarsa` + biaya pengajuan dikembalikan
   PENUH ke saldo organisasi (yang lalai mitra sponsor, bukan organisasi).
   Sengaja hanya menyasar `diajukan`: pada `perlu_revisi` bolanya ada di
   organisasi, jadi tidak adil membatalkannya.
   Idempoten — hanya menyentuh baris yang memang sudah lewat tenggat. */
async function expireStale(): Promise<{ expired: number; ids: string[] }> {
  const rows = (await sql`
    select id, org_id, funder_id, event_name
    from pengajuan
    where status = 'diajukan'
      and updated_at < now() - make_interval(days => ${EXPIRE_DAYS})`) as any[];

  const ids: string[] = [];
  for (const p of rows) {
    const note =
      `The Sponsor Partner did not respond within ${EXPIRE_DAYS} days. The submission was cancelled automatically; ` +
      `the Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} submission fee was fully refunded to the organization balance.`;
    const tx: any[] = [
      // Kunci status di WHERE: kalau mitra sponsor memutuskan barusan, baris ini tidak tersentuh.
      sql`update pengajuan set status = 'kadaluarsa', updated_at = now()
          where id = ${p.id} and status = 'diajukan'`,
      histQ(p.id, "Kadaluarsa otomatis", "Admin", note),
      auditQ(null, "pengajuan.kadaluarsa", p.id, { days: EXPIRE_DAYS, refund: SUBMISSION_FEE }),
      sql`update organizations set balance = balance + ${SUBMISSION_FEE} where id = ${p.org_id}`,
    ];
    const oUser = await userIdForOrg(p.org_id);
    if (oUser)
      tx.push(
        notifQ(
          oUser,
          "pengajuan.kadaluarsa",
          `Submission "${p.event_name}" expired (the sponsor partner did not respond within ${EXPIRE_DAYS} days). Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} was refunded to your balance.`,
          orgLink(p.id),
        ),
      );
    const fUser = await userIdForFunder(p.funder_id);
    if (fUser)
      tx.push(
        notifQ(
          fUser,
          "pengajuan.kadaluarsa",
          `Submission "${p.event_name}" expired because it was not reviewed within ${EXPIRE_DAYS} days.`,
          funderLink(p.id),
        ),
      );
    await sql.transaction(tx);
    ids.push(p.id);
  }
  return { expired: ids.length, ids };
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

const notifQ = (userId: string, type: string, message: string, link: string | null = null) =>
  sql`insert into notifications (user_id, type, message, link)
      values (${userId}, ${type}, ${message}, ${link})`;

/* Tautan langsung ke pengajuan, sesuai peran penerima notifikasi.
   Organisasi & admin memakai daftar + parameter id (detail tampil sebagai
   dialog), mitra sponsor punya halaman tinjauan tersendiri. */
const orgLink = (id: string) => `/org/pengajuan?id=${encodeURIComponent(id)}`;
const funderLink = (id: string) => `/funder/pengajuan/${encodeURIComponent(id)}`;

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
  if (!r.length) throw new HttpError(404, "Submission not found.");
  return r[0];
}

/* Tulis pengajuan (save/submit) hanya oleh organisasi pemiliknya.
   Bila baris sudah ada, kepemilikan dibaca dari DB — bukan dari `orgId`
   kiriman client, supaya tak bisa diakui lewat body request. */
async function requireOwnsPengajuan(session: any, p: any): Promise<void> {
  const id = String(p?.id || "");
  if (!id) throw new HttpError(400, "Submission id is required.");
  const rows = (await sql`select org_id from pengajuan where id = ${id} limit 1`) as any[];
  const ownerOrgId = rows[0]?.org_id ?? String(p?.orgId || "");
  requireOrg(session, ownerOrgId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Cron Vercel memanggil lewat GET (?op=expire). Ditumpangkan ke fungsi ini
  // karena kuota Serverless Function (Hobby) sudah terpakai penuh 12/12.
  const isCron = req.method === "GET" && String((req.query as any)?.op || "") === "expire";
  if (isCron) {
    // Vercel mengirim `Authorization: Bearer $CRON_SECRET` bila env itu diset.
    // Bila belum diset, jalur ini tetap terbuka — aman secara efek karena
    // operasinya idempoten dan hanya menyentuh baris yang memang lewat tenggat.
    const secret = process.env.CRON_SECRET;
    if (secret && req.headers.authorization !== `Bearer ${secret}`)
      return res.status(401).json({ error: "Unauthorized" });
    try {
      return res.status(200).json(await expireStale());
    } catch (e: any) {
      return res.status(500).json({ error: String(e?.message || e) });
    }
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await requireAuth(req);
    const b = readBody(req);
    const op = b.op as string;

    if (op === "expire") {
      // Jalur manual (mis. tombol admin / uji coba): kembalikan state terbaru.
      requireAdmin(session);
      await expireStale();
      return res.status(200).json(await assembleState(session.userId));
    }

    if (op === "save") {
      const p = b.pengajuan;
      // Hanya organisasi pemilik yang boleh menulis pengajuan ini. Bila id sudah
      // ada, pemiliknya dikunci ke baris DB (bukan orgId kiriman client).
      await requireOwnsPengajuan(session, p);
      const existing = (await sql`select id from pengajuan where id = ${p.id} limit 1`) as any[];
      const docs = await resolveDocuments(p.id, p.documents);
      const tx = [upsertPengajuan(p, p.status || "draf", p.revisionNote ?? null, docs)];
      if (!existing.length) tx.push(histQ(p.id, "Pengajuan dibuat", "Organisasi", "Draf pengajuan disimpan."));
      await sql.transaction(tx);
    } else if (op === "submit") {
      const p = b.pengajuan;
      await requireOwnsPengajuan(session, p);
      // Gate: organisasi wajib terverifikasi admin sebelum boleh mengirim pengajuan.
      const org = (await sql`select verification_status from organizations where id = ${p.orgId} limit 1`) as any[];
      if (org[0]?.verification_status !== "terverifikasi")
        throw new HttpError(400, "Your organization is not admin-verified yet. Request verification before sending a submission.");
      const existing = (await sql`select status from pengajuan where id = ${p.id} limit 1`) as any[];
      const isFirst = !existing.length || existing[0].status === "draf";
      if (isFirst) {
        const bal = (await sql`select balance from organizations where id = ${p.orgId} limit 1`) as any[];
        if (Number(bal[0]?.balance ?? 0) < SUBMISSION_FEE)
          throw new HttpError(400, `Not enough balance for the Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} submission fee.`);
      }
      const action = existing[0]?.status === "perlu_revisi" ? "Diajukan ulang" : "Diajukan ke mitra sponsor";
      const note = isFirst
        ? `Submission sent to the sponsor partner. A ${SUBMISSION_FEE.toLocaleString("id-ID")} submission fee was deducted from your balance.`
        : "Pengajuan dikirim ke mitra sponsor untuk ditinjau.";
      const docs = await resolveDocuments(p.id, p.documents);
      const tx: any[] = [upsertPengajuan(p, "diajukan", null, docs), histQ(p.id, action, "Organisasi", note)];
      if (isFirst) tx.push(sql`update organizations set balance = greatest(0, balance - ${SUBMISSION_FEE}) where id = ${p.orgId}`);
      tx.push(auditQ(session.userId, "pengajuan.diajukan", p.id, { packages: cleanPackages(p.packages).length }));
      const fUser = await userIdForFunder(p.funderId);
      if (fUser) tx.push(notifQ(fUser, "pengajuan.diajukan", `New submission "${p.eventName}" is waiting for your review.`, funderLink(p.id)));
      await sql.transaction(tx);
    } else if (op === "approve") {
      const p = await getPengajuan(b.id);
      // Keputusan pendanaan = hak mitra sponsor tujuan saja.
      requireFunder(session, p.funder_id);
      if (p.status === "disetujui" || p.status === "ditolak")
        throw new HttpError(400, "This submission has already been decided.");
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
          "Disetujui mitra sponsor",
          "Pendana",
          `The Sponsor Partner approved the "${chosen?.name ?? ""}" package. The deal is final. The Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} submission fee becomes an admin fee (not refunded).`,
        ),
        auditQ(session.userId, "pengajuan.disetujui", b.id, { amount, package: chosen?.name ?? "", adminFee: SUBMISSION_FEE, refund: 0 }),
      ];
      if (amount > 0)
        tx.push(sql`update funders set budget_remaining = greatest(0, budget_remaining - ${amount}) where id = ${p.funder_id}`);
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.disetujui", `Submission "${p.event_name}" was approved by the sponsor partner. The Rp ${SUBMISSION_FEE.toLocaleString("id-ID")} submission fee becomes an admin fee.`, orgLink(b.id)));
      await sql.transaction(tx);
    } else if (op === "reject") {
      const p = await getPengajuan(b.id);
      requireFunder(session, p.funder_id);
      if (p.status === "disetujui" || p.status === "ditolak")
        throw new HttpError(400, "This submission has already been decided.");
      const note = (b.note || "").trim() || "Mitra Sponsor menolak pengajuan.";
      const tx: any[] = [
        sql`update pengajuan set status = 'ditolak', updated_at = now() where id = ${b.id}`,
        histQ(b.id, "Ditolak mitra sponsor", "Pendana", `${note} An admin fee of Rp ${REJECT_ADMIN_FEE.toLocaleString("id-ID")} is retained; Rp ${REJECT_REFUND.toLocaleString("id-ID")} is refunded to the organization balance.`),
        auditQ(session.userId, "pengajuan.ditolak", b.id, { adminFee: REJECT_ADMIN_FEE, refund: REJECT_REFUND }),
        // Tolak → kembalikan sisa biaya (dikurangi biaya admin) ke saldo organisasi.
        sql`update organizations set balance = balance + ${REJECT_REFUND} where id = ${p.org_id}`,
      ];
      const oUser = await userIdForOrg(p.org_id);
      if (oUser) tx.push(notifQ(oUser, "pengajuan.ditolak", `Submission "${p.event_name}" was rejected by the sponsor partner. Rp ${REJECT_REFUND.toLocaleString("id-ID")} was refunded to your balance (admin fee Rp ${REJECT_ADMIN_FEE.toLocaleString("id-ID")}).`, orgLink(b.id)));
      await sql.transaction(tx);
    } else if (op === "feedback") {
      const p = await getPengajuan(b.id);
      requireFunder(session, p.funder_id);
      const packages = Array.isArray(p.packages) ? p.packages : [];
      // Paket yang diminta direvisi wajib ditunjuk, agar organisasi tahu
      // persis bagian mana yang harus diperbaiki.
      const idx = Number(b.selectedPackage);
      if (!Number.isInteger(idx) || idx < 0 || idx >= packages.length)
        throw new HttpError(400, "Pilih paket yang ingin direvisi dulu.");
      const pkgName = packages[idx]?.name ?? "";
      const note = (b.note || "").trim() || "Mitra Sponsor meminta revisi.";
      const tx: any[] = [
        sql`update pengajuan set status = 'perlu_revisi', revision_note = ${note},
              selected_package = ${idx}, updated_at = now() where id = ${b.id}`,
        histQ(b.id, `Revision requested — package "${pkgName}"`, "Pendana", note),
        auditQ(session.userId, "pengajuan.revisi", b.id, { package: pkgName, selectedPackage: idx }),
      ];
      const oUser = await userIdForOrg(p.org_id);
      if (oUser)
        tx.push(
          notifQ(
            oUser,
            "pengajuan.revisi",
            `Submission "${p.event_name}" needs a revision on package "${pkgName}".`,
            orgLink(b.id),
          ),
        );
      await sql.transaction(tx);
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }

    res.status(200).json(await assembleState(session.userId));
  } catch (e: any) {
    const status = e instanceof HttpError || e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
