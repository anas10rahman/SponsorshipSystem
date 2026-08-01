import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";

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

    if (orgId) {
      const rows = (await sql`
        select compro_data, pic_id_doc_data, legal_docs_data
        from organizations where id = ${orgId} limit 1`) as any[];
      const row = rows[0] ?? {};
      if (kind === "compro") return res.status(200).json({ data: row.compro_data ?? null });
      if (kind === "ktp") return res.status(200).json({ data: row.pic_id_doc_data ?? null });
      if (kind === "legal") {
        const docs = Array.isArray(row.legal_docs_data) ? row.legal_docs_data : [];
        return res.status(200).json({ data: docs[index]?.data ?? null });
      }
      return res.status(400).json({ error: "kind harus 'compro', 'ktp', atau 'legal'." });
    }

    const rows = (await sql`
      select compro_data, legal_docs_data from funders where id = ${funderId} limit 1`) as any[];
    const row = rows[0] ?? {};
    if (kind === "compro") return res.status(200).json({ data: row.compro_data ?? null });
    if (kind === "legal") {
      const docs = Array.isArray(row.legal_docs_data) ? row.legal_docs_data : [];
      return res.status(200).json({ data: docs[index]?.data ?? null });
    }
    return res.status(400).json({ error: "kind harus 'compro' atau 'legal'." });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
