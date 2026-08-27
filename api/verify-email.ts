import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";
import { setSession } from "./_auth.js";
import { MAX_OTP_ATTEMPTS } from "./_email.js";

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
    if (!email || !code) throw new HttpError(400, "Email and code are required.");

    const rows = (await sql`
      select id, email_verified, verify_attempts,
             (verify_expires is not null and verify_expires < now()) as expired,
             (verify_code is not null and verify_code = crypt(${code}, verify_code)) as code_ok
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];
    if (!row) throw new HttpError(404, "Account not found.");
    if (row.email_verified) throw new HttpError(400, "Email already verified. Please sign in.");
    if (row.expired) throw new HttpError(400, "The code has expired. Request a resend.");

    // Batasi salah-tebak: setelah MAX_OTP_ATTEMPTS kali, kode dihanguskan agar
    // penebakan beruntun tidak bisa menembus akun dalam masa berlaku kode.
    if (!row.code_ok) {
      const used = Number(row.verify_attempts ?? 0) + 1;
      if (used >= MAX_OTP_ATTEMPTS) {
        await sql`update users set verify_code = null, verify_expires = null, verify_attempts = 0
                  where id = ${row.id}`;
        throw new HttpError(400, "Terlalu banyak percobaan. Kode dibatalkan — minta kirim ulang.");
      }
      await sql`update users set verify_attempts = ${used} where id = ${row.id}`;
      throw new HttpError(400, "Wrong verification code.");
    }

    await sql`
      update users set email_verified = true, verify_code = null, verify_expires = null,
        verify_attempts = 0
      where id = ${row.id}`;

    setSession(res, row.id);
    res.status(200).json({ userId: row.id, state: await assembleState(row.id) });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
