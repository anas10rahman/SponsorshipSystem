import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, readBody } from "./_db.js";
import { makeOtp, sendVerificationEmail, hasEmailProvider, OTP_TTL_MIN } from "./_email.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Kirim ulang kode OTP ke email yang belum terverifikasi (rate-limit 30 detik). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    if (!hasEmailProvider()) throw new HttpError(400, "Layanan email belum dikonfigurasi.");
    const b = readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    if (!email) throw new HttpError(400, "Email wajib diisi.");

    const rows = (await sql`
      select id, email_verified,
             (verify_expires is null
               or verify_expires - make_interval(mins => ${OTP_TTL_MIN}) < now() - interval '30 seconds'
             ) as can_resend
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];
    if (!row) throw new HttpError(404, "Akun tidak ditemukan.");
    if (row.email_verified) throw new HttpError(400, "Email sudah terverifikasi. Silakan login.");
    if (!row.can_resend) throw new HttpError(429, "Tunggu sebentar sebelum minta kode lagi.");

    const code = makeOtp();
    await sql`
      update users set verify_code = crypt(${code}, gen_salt('bf')),
        verify_expires = now() + make_interval(mins => ${OTP_TTL_MIN})
      where id = ${row.id}`;
    const mail = await sendVerificationEmail(email, code);
    res.status(200).json({ ok: true, emailSent: mail.ok, ...(mail.ok ? {} : { emailError: mail.error }) });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
