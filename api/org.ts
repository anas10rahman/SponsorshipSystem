import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    if (b.op === "update") {
      const o = b.org;
      await sql`
        update organizations set
          name = ${o.name}, category = ${o.category}, city = ${o.city},
          logo_initials = ${o.logoInitials}, logo_url = ${o.logoUrl ?? null},
          email = ${o.email}, description = ${o.description},
          website = ${o.website ?? null}, instagram = ${o.instagram ?? null},
          twitter = ${o.twitter ?? null}, facebook = ${o.facebook ?? null},
          payout_account = ${o.payoutAccount}, phone = ${o.phone},
          pic_name = ${o.pic.name}, pic_phone = ${o.pic.phone},
          pic_position = ${o.pic.position}, pic_email = ${o.pic.email},
          pic_id_doc_url = ${o.pic.idDocUrl}
        where id = ${o.id}`;
    } else if (b.op === "topup") {
      await sql`update organizations set balance = balance + ${b.amount} where id = ${b.orgId}`;
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }
    res.status(200).json(await assembleState());
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
