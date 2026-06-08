import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    if (b.op === "read") {
      await sql`update notifications set read = true where id = ${b.id}`;
    } else if (b.op === "readAll") {
      await sql`update notifications set read = true where user_id = ${b.userId}`;
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }
    res.status(200).json(await assembleState());
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
