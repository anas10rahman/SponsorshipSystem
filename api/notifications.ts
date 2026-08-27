import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";
import { AuthError, requireAuth } from "./_auth.js";

/* Notifikasi selalu dilingkupi user pemanggil (dari sesi), bukan userId
   yang dikirim client — supaya tak bisa menyentuh notifikasi orang lain. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { userId } = await requireAuth(req);
    const b = readBody(req);
    if (b.op === "read") {
      await sql`update notifications set read = true
                where id = ${b.id} and user_id = ${userId}`;
    } else if (b.op === "readAll") {
      await sql`update notifications set read = true where user_id = ${userId}`;
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }
    res.status(200).json(await assembleState(userId));
  } catch (e: any) {
    const status = e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
