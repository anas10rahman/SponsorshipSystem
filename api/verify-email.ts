import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Verifikasi email via kode OTP. Sukses → email_verified=true, kode dihapus,
   dan mengembalikan AppState + userId agar client bisa langsung login. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    const code = String(b.code || "").trim();
    if (!email || !code) throw new HttpError(400, "Email & kode wajib diisi.");

    const rows = (await sql`
      select id, email_verified,
             (verify_expires is not null and verify_expires < now()) as expired,
             (verify_code is not null and verify_code = crypt(${code}, verify_code)) as code_ok
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];
    if (!row) throw new HttpError(404, "Akun tidak ditemukan.");
    if (row.email_verified) throw new HttpError(400, "Email sudah terverifikasi. Silakan login.");
    if (row.expired) throw new HttpError(400, "Kode sudah kedaluwarsa. Minta kirim ulang.");
    if (!row.code_ok) throw new HttpError(400, "Kode verifikasi salah.");

    await sql`
      update users set email_verified = true, verify_code = null, verify_expires = null
      where id = ${row.id}`;

    res.status(200).json({ userId: row.id, state: await assembleState() });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
