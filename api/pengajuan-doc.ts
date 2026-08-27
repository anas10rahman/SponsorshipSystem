import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./_db.js";
import { AuthError, requireAuth } from "./_auth.js";

// Lazy-load isi PDF (base64) satu dokumen saat preview dibuka — tidak ikut di /api/state.
// Hanya pihak yang terlibat pada pengajuan (organisasi pengirim, mitra sponsor
// tujuan) atau admin yang boleh mengambilnya.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const session = await requireAuth(req);
    const id = String(req.query.id || "");
    if (!id) return res.status(400).json({ error: "id is required." });
    const index = Math.max(0, Number(req.query.index) || 0);
    const rows = (await sql`
      select org_id, funder_id, documents, proposal_doc_data
      from pengajuan where id = ${id} limit 1`) as any[];
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "Submission not found." });

    const allowed =
      session.role === "admin" ||
      (session.role === "org" && session.orgId === row.org_id) ||
      (session.role === "funder" && session.funderId === row.funder_id);
    if (!allowed) throw new AuthError(403, "Tidak berhak atas dokumen pengajuan ini.");

    const docs = Array.isArray(row.documents) ? row.documents : [];
    // Sumber utama: array documents; fallback data lama proposal_doc_data (index 0).
    const data = docs[index]?.data ?? (index === 0 ? row.proposal_doc_data ?? null : null);
    res.status(200).json({ data });
  } catch (e: any) {
    const status = e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
