import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";

// Lazy-load isi PDF (base64) saat preview dibuka — tidak ikut di /api/state.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "id wajib." });
    const rows = (await sql`select proposal_doc_data from pengajuan where id = ${id} limit 1`) as any[];
    res.status(200).json({ proposalDocData: rows[0]?.proposal_doc_data ?? null });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
