import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";

// Lazy-load isi attachment organisasi (compro / KTP) saat preview — tidak ikut di /api/state.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const orgId = String(req.query.orgId || "");
    const kind = String(req.query.kind || "");
    if (!orgId) return res.status(400).json({ error: "orgId wajib." });
    const col = kind === "compro" ? "compro_data" : kind === "ktp" ? "pic_id_doc_data" : "";
    if (!col) return res.status(400).json({ error: "kind harus 'compro' atau 'ktp'." });
    const rows = (await sql`
      select compro_data, pic_id_doc_data from organizations where id = ${orgId} limit 1`) as any[];
    const row = rows[0] ?? {};
    const data = kind === "compro" ? row.compro_data : row.pic_id_doc_data;
    res.status(200).json({ data: data ?? null });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
