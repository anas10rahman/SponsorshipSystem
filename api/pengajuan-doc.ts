import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";

// Lazy-load isi PDF (base64) satu dokumen saat preview dibuka — tidak ikut di /api/state.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "id wajib." });
    const index = Math.max(0, Number(req.query.index) || 0);
    const rows = (await sql`
      select documents, proposal_doc_data from pengajuan where id = ${id} limit 1`) as any[];
    const row = rows[0];
    const docs = Array.isArray(row?.documents) ? row.documents : [];
    // Sumber utama: array documents; fallback data lama proposal_doc_data (index 0).
    const data = docs[index]?.data ?? (index === 0 ? row?.proposal_doc_data ?? null : null);
    res.status(200).json({ data });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
