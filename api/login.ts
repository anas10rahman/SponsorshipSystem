import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapUser, readBody } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { username, password } = readBody(req);
    if (!username || !password)
      return res.status(400).json({ error: "Username & kata sandi wajib diisi." });
    const rows = (await sql`
      select * from users
      where username = ${username} and password_hash = crypt(${password}, password_hash)
      limit 1`) as any[];
    if (!rows.length)
      return res.status(401).json({ error: "Username atau kata sandi tidak sesuai." });
    res.status(200).json({ user: mapUser(rows[0]) });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
