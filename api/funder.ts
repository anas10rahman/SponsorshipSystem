import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";


/* Gabungkan berkas legal masuk dengan yang tersimpan: poin tanpa `data`
   (mis. saat menyimpan profil tanpa mengunggah ulang) mempertahankan isi lama
   berdasarkan nama. Hanya berkas yang akhirnya punya data yang disimpan. */
async function resolveLegalDocs(
  table: "organizations" | "funders",
  id: string,
  incoming: any,
): Promise<any[]> {
  const docs = Array.isArray(incoming) ? incoming : [];
  const prev =
    table === "organizations"
      ? ((await sql`select legal_docs_data from organizations where id = ${id} limit 1`) as any[])
      : ((await sql`select legal_docs_data from funders where id = ${id} limit 1`) as any[]);
  const stored: any[] = Array.isArray(prev[0]?.legal_docs_data) ? prev[0].legal_docs_data : [];
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    if (b.op === "update") {
      const f = b.funder;
      const legal = await resolveLegalDocs("funders", f.id, f.legalDocs);
      const newTotal = Math.max(0, Number(f.budgetTotal) || 0);
      // Anggaran total di-set mitra sponsor; sisa dihitung ulang = total - yang sudah terpakai
      // (terpakai = total_lama - sisa_lama). Di-clamp agar patuh constraint.
      await sql`
        update funders set
          name = ${f.name}, type = ${f.type}, focus = ${f.focus},
          email = ${f.email}, description = ${f.description},
          website = ${f.website ?? null}, instagram = ${f.instagram ?? null},
          twitter = ${f.twitter ?? null}, facebook = ${f.facebook ?? null},
          logo_url = ${f.logoUrl ?? null}, phone = ${f.phone},
          address = ${f.address ?? ""},
          compro_url = ${f.comproUrl ?? null},
          compro_data = coalesce(${f.comproData ?? null}, compro_data),
          legal_docs_data = ${JSON.stringify(legal)}::jsonb,
          budget_total = ${newTotal},
          budget_remaining = least(${newTotal}, greatest(0, ${newTotal} - (budget_total - budget_remaining))),
          pic_name = ${f.pic.name}, pic_phone = ${f.pic.phone},
          pic_position = ${f.pic.position}, pic_email = ${f.pic.email}
        where id = ${f.id}`;
    } else if (b.op === "delete_funder") {
      // Admin hapus mitra sponsor: hapus akun login + transaksi dulu (FK), lalu
      // mitra sponsor (pengajuan & proposal_supporters ikut cascade).
      const exists = (await sql`select 1 from funders where id = ${b.funderId} limit 1`) as any[];
      if (!exists.length) return res.status(404).json({ error: "Mitra Sponsor tidak ditemukan." });
      await sql.transaction([
        sql`delete from transactions where funder_id = ${b.funderId}`,
        sql`delete from users where funder_id = ${b.funderId}`,
        sql`delete from funders where id = ${b.funderId}`,
      ]);
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }
    res.status(200).json(await assembleState());
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
