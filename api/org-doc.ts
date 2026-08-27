import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";
import { AuthError, requireAuth, requireOrg, requireFunder } from "./_auth.js";

/* Ambil isi berkas (data URL) saat pratinjau — sengaja tidak ikut di /api/state
   supaya payload tetap ringan.

   Organisasi   : ?orgId=…&kind=compro | ktp | legal (&index=N)
   Mitra sponsor: ?funderId=…&kind=compro | legal (&index=N)          */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const orgId = String(req.query.orgId || "");
    const funderId = String(req.query.funderId || "");
    const kind = String(req.query.kind || "");
    const index = Number(req.query.index || 0);

    if (!orgId && !funderId)
      return res.status(400).json({ error: "orgId atau funderId wajib." });
    // Id non-UUID bikin Postgres melempar error; tolak rapi supaya bukan 500.
    const isUuid = (v: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
    if ((orgId && !isUuid(orgId)) || (funderId && !isUuid(funderId)))
      return res.status(400).json({ error: "Invalid id." });

    const session = await requireAuth(req);

    if (orgId) {
      // KTP/KTM = identitas pribadi: hanya pemilik organisasi & admin.
      // Berkas lain boleh dilihat mitra sponsor yang memang menerima
      // pengajuan dari organisasi tersebut (butuh untuk menilai).
      if (kind === "ktp") {
        requireOrg(session, orgId);
      } else if (session.role === "funder") {
        const rel = (await sql`
          select 1 from pengajuan
          where org_id = ${orgId} and funder_id = ${session.funderId} limit 1`) as any[];
        if (!rel.length) throw new AuthError(403, "Tidak berhak atas berkas organisasi ini.");
      } else {
        requireOrg(session, orgId);
      }

      const rows = (await sql`
        select compro_data, pic_id_doc_data, pic_photo, legal_docs_data
        from organizations where id = ${orgId} limit 1`) as any[];
      const row = rows[0] ?? {};
      if (kind === "compro") return res.status(200).json({ data: row.compro_data ?? null });
      if (kind === "ktp") return res.status(200).json({ data: row.pic_id_doc_data ?? null });
      if (kind === "picphoto") return res.status(200).json({ data: row.pic_photo ?? null });
      if (kind === "legal") {
        const docs = Array.isArray(row.legal_docs_data) ? row.legal_docs_data : [];
        return res.status(200).json({ data: docs[index]?.data ?? null });
      }
      return res
        .status(400)
        .json({ error: "kind harus 'compro', 'ktp', 'picphoto', atau 'legal'." });
    }

    // Berkas mitra sponsor: pemilik & admin penuh; organisasi hanya bila
    // sudah punya pengajuan ke mitra sponsor tersebut.
    if (session.role === "org") {
      const rel = (await sql`
        select 1 from pengajuan
        where funder_id = ${funderId} and org_id = ${session.orgId} limit 1`) as any[];
      if (!rel.length) throw new AuthError(403, "Tidak berhak atas berkas mitra sponsor ini.");
    } else {
      requireFunder(session, funderId);
    }

    const rows = (await sql`
      select compro_data, legal_docs_data from funders where id = ${funderId} limit 1`) as any[];
    const row = rows[0] ?? {};
    if (kind === "compro") return res.status(200).json({ data: row.compro_data ?? null });
    if (kind === "legal") {
      const docs = Array.isArray(row.legal_docs_data) ? row.legal_docs_data : [];
      return res.status(200).json({ data: docs[index]?.data ?? null });
    }
    return res.status(400).json({ error: "kind must be 'compro' or 'legal'." });
  } catch (e: any) {
    const status = e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
