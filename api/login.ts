import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapUser, readBody } from "./_db.js";
import { makeOtp, sendResetEmail, hasEmailProvider, OTP_TTL_MIN } from "./_email.js";
import { validatePassword } from "./_password.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Endpoint kredensial akun. Dirouting lewat field `op`:
   - (default) "login" : autentikasi username + password
   - "forgot"          : minta kode reset password (respons netral, anti-enumeration)
   - "reset"           : set password baru dengan kode
   - "change"          : ganti password dari dalam akun (wajib password lama)
   Semuanya digabung di satu fungsi agar tetap di bawah limit 12 Serverless
   Function (Vercel Hobby). Jalur login lama tidak berubah perilakunya. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    const op = String(b.op || "login");
    if (op === "forgot") return await handleForgot(b, res);
    if (op === "reset") return await handleReset(b, res);
    if (op === "change") return await handleChange(b, res);
    return await handleLogin(b, res);
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}

/* --- Login (perilaku asli, tidak diubah) --- */
async function handleLogin(b: any, res: VercelResponse) {
  const { username, password } = b;
  if (!username || !password)
    return res.status(400).json({ error: "Username & kata sandi wajib diisi." });
  const rows = (await sql`
    select * from users
    where username = ${username} and password_hash = crypt(${password}, password_hash)
    limit 1`) as any[];
  if (!rows.length)
    return res.status(401).json({ error: "Username atau kata sandi tidak sesuai." });
  // Gate: email harus terverifikasi sebelum bisa masuk.
  if (rows[0].email_verified === false)
    return res.status(403).json({
      error: "Email belum diverifikasi. Cek email untuk kode verifikasi.",
      needsVerification: true,
      email: rows[0].email,
    });
  res.status(200).json({ user: mapUser(rows[0]) });
}

/* --- Step A reset: minta kode. SELALU balas netral (anti user-enumeration).
   Email hanya dikirim bila akun ada; rate-limit senyap 30 dtk. --- */
async function handleForgot(b: any, res: VercelResponse) {
  const neutral = {
    ok: true,
    message: "Jika email terdaftar, kami telah mengirim kode reset. Cek inbox/spam Anda.",
  };
  try {
    const email = String(b.email || "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(200).json(neutral);
    if (!hasEmailProvider()) return res.status(200).json(neutral);

    const rows = (await sql`
      select id,
             (reset_expires is null
               or reset_expires - make_interval(mins => ${OTP_TTL_MIN}) < now() - interval '30 seconds'
             ) as can_send
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];
    if (row && row.can_send) {
      const code = makeOtp();
      await sql`
        update users set reset_code = crypt(${code}, gen_salt('bf')),
          reset_expires = now() + make_interval(mins => ${OTP_TTL_MIN})
        where id = ${row.id}`;
      await sendResetEmail(email, code);
    }
    return res.status(200).json(neutral);
  } catch {
    // Bahkan saat error internal, jangan bocorkan detail — tetap netral.
    return res.status(200).json(neutral);
  }
}

/* --- Step B reset: kode + password baru. Kode salah/email tak dikenal → pesan
   seragam. Sukses → password diganti, kode dihangus (sekali pakai). --- */
async function handleReset(b: any, res: VercelResponse) {
  const email = String(b.email || "").trim().toLowerCase();
  const code = String(b.code || "").trim();
  const password = String(b.password || "");

  if (!email || !code) throw new HttpError(400, "Email & kode wajib diisi.");
  const pwErr = validatePassword(password);
  if (pwErr) throw new HttpError(400, pwErr);

  const rows = (await sql`
    select id,
           (reset_expires is not null and reset_expires < now()) as expired,
           (reset_code is not null and reset_code = crypt(${code}, reset_code)) as code_ok
    from users where email = ${email} limit 1`) as any[];
  const row = rows[0];
  if (!row || !row.code_ok || row.expired)
    throw new HttpError(400, "Kode salah atau sudah kadaluarsa. Minta kode baru.");

  await sql`
    update users set password_hash = crypt(${password}, gen_salt('bf')),
      reset_code = null, reset_expires = null
    where id = ${row.id}`;
  res.status(200).json({ ok: true });
}

/* --- Ganti password dari dalam akun (user sudah login).
   Password lama WAJIB diverifikasi: itu jangkar keamanannya, karena userId
   dikirim dari client. Tanpa itu, siapa pun yang tahu userId bisa mengganti
   password milik orang lain. --- */
async function handleChange(b: any, res: VercelResponse) {
  const userId = String(b.userId || "").trim();
  const currentPassword = String(b.currentPassword || "");
  const password = String(b.password || "");

  if (!userId || !currentPassword)
    throw new HttpError(400, "Kata sandi saat ini wajib diisi.");
  // Jaga-jaga: id non-UUID bikin Postgres melempar error (→ 500). Tolak rapi.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
    throw new HttpError(401, "Sesi tidak valid. Silakan masuk ulang.");
  const pwErr = validatePassword(password);
  if (pwErr) throw new HttpError(400, pwErr);
  if (password === currentPassword)
    throw new HttpError(400, "Kata sandi baru harus berbeda dari kata sandi saat ini.");

  const rows = (await sql`
    select id, (password_hash = crypt(${currentPassword}, password_hash)) as pw_ok
    from users where id = ${userId} limit 1`) as any[];
  const row = rows[0];
  if (!row || !row.pw_ok) throw new HttpError(401, "Kata sandi saat ini tidak sesuai.");

  // Ganti password sekaligus hanguskan kode reset yang mungkin masih hidup.
  await sql`
    update users set password_hash = crypt(${password}, gen_salt('bf')),
      reset_code = null, reset_expires = null
    where id = ${row.id}`;
  res.status(200).json({ ok: true });
}
