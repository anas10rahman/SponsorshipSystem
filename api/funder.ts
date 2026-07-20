import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    if (b.op === "update") {
      const f = b.funder;
      const newTotal = Math.max(0, Number(f.budgetTotal) || 0);
      // Anggaran total di-set pendana; sisa dihitung ulang = total - yang sudah terpakai
      // (terpakai = total_lama - sisa_lama). Di-clamp agar patuh constraint.
      await sql`
        update funders set
          name = ${f.name}, type = ${f.type}, focus = ${f.focus},
          email = ${f.email}, description = ${f.description},
          website = ${f.website ?? null}, instagram = ${f.instagram ?? null},
          twitter = ${f.twitter ?? null}, facebook = ${f.facebook ?? null},
          logo_url = ${f.logoUrl ?? null}, phone = ${f.phone},
          budget_total = ${newTotal},
          budget_remaining = least(${newTotal}, greatest(0, ${newTotal} - (budget_total - budget_remaining))),
          pic_name = ${f.pic.name}, pic_phone = ${f.pic.phone},
          pic_position = ${f.pic.position}, pic_email = ${f.pic.email}
        where id = ${f.id}`;
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }
    res.status(200).json(await assembleState());
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
