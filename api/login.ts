import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, mapUser, readBody } from "./_db.js";
import {
  makeOtp,
  sendResetEmail,
  hasEmailProvider,
  OTP_TTL_MIN,
  MAX_OTP_ATTEMPTS,
} from "./_email.js";
import { validatePassword } from "./_password.js";
import { AuthError, requireAuth, setSession, clearSession } from "./_auth.js";

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
    if (op === "change") return await handleChange(req, b, res);
    if (op === "logout") {
      clearSession(res);
      return res.status(200).json({ ok: true });
    }
    return await handleLogin(b, res);
  } catch (e: any) {
    const status = e instanceof HttpError || e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}

/* --- Login (perilaku asli, tidak diubah) --- */
async function handleLogin(b: any, res: VercelResponse) {
  const { username, password } = b;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required." });
  const rows = (await sql`
    select * from users
    where username = ${username} and password_hash = crypt(${password}, password_hash)
    limit 1`) as any[];
  if (!rows.length)
    return res.status(401).json({ error: "Incorrect username or password." });
  // Gate: email harus terverifikasi sebelum bisa masuk.
  if (rows[0].email_verified === false)
    return res.status(403).json({
      error: "Email is not verified yet. Check your inbox for the verification code.",
      needsVerification: true,
      email: rows[0].email,
    });
  setSession(res, rows[0].id);
  res.status(200).json({ user: mapUser(rows[0]) });
}

/* --- Step A reset: minta kode. SELALU balas netral (anti user-enumeration).
   Email hanya dikirim bila akun ada; rate-limit senyap 30 dtk. --- */
async function handleForgot(b: any, res: VercelResponse) {
  const neutral = {
    ok: true,
    message: "If that email is registered, we have sent a reset code. Check your inbox or spam folder.",
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
          reset_expires = now() + make_interval(mins => ${OTP_TTL_MIN}),
          reset_attempts = 0
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

  if (!email || !code) throw new HttpError(400, "Email and code are required.");
  const pwErr = validatePassword(password);
  if (pwErr) throw new HttpError(400, pwErr);

  const rows = (await sql`
    select id, reset_attempts,
           (reset_expires is not null and reset_expires < now()) as expired,
           (reset_code is not null and reset_code = crypt(${code}, reset_code)) as code_ok
    from users where email = ${email} limit 1`) as any[];
  const row = rows[0];

  // Kode 6 digit → ruang tebak kecil. Batasi percobaan: setelah MAX_OTP_ATTEMPTS
  // kali salah, kode langsung dihanguskan sehingga penebakan beruntun mati dan
  // pemilik akun harus meminta kode baru.
  if (row && !row.code_ok && !row.expired) {
    const used = Number(row.reset_attempts ?? 0) + 1;
    if (used >= MAX_OTP_ATTEMPTS) {
      await sql`update users set reset_code = null, reset_expires = null, reset_attempts = 0
                where id = ${row.id}`;
      throw new HttpError(400, "Terlalu banyak percobaan. Kode dibatalkan — minta kode baru.");
    }
    await sql`update users set reset_attempts = ${used} where id = ${row.id}`;
  }

  if (!row || !row.code_ok || row.expired)
    throw new HttpError(400, "The code is wrong or has expired. Request a new one.");

  await sql`
    update users set password_hash = crypt(${password}, gen_salt('bf')),
      reset_code = null, reset_expires = null, reset_attempts = 0
    where id = ${row.id}`;
  res.status(200).json({ ok: true });
}

/* --- Ganti password dari dalam akun. userId diambil dari SESI (bukan body),
   dan password lama tetap wajib diverifikasi sebagai lapis kedua. --- */
async function handleChange(req: VercelRequest, b: any, res: VercelResponse) {
  const { userId } = await requireAuth(req);
  const currentPassword = String(b.currentPassword || "");
  const password = String(b.password || "");

  if (!currentPassword) throw new HttpError(400, "Your current password is required.");
  const pwErr = validatePassword(password);
  if (pwErr) throw new HttpError(400, pwErr);
  if (password === currentPassword)
    throw new HttpError(400, "The new password must differ from the current one.");

  const rows = (await sql`
    select id, (password_hash = crypt(${currentPassword}, password_hash)) as pw_ok
    from users where id = ${userId} limit 1`) as any[];
  const row = rows[0];
  if (!row || !row.pw_ok) throw new HttpError(401, "Your current password is incorrect.");

  // Ganti password sekaligus hanguskan kode reset yang mungkin masih hidup.
  await sql`
    update users set password_hash = crypt(${password}, gen_salt('bf')),
      reset_code = null, reset_expires = null
    where id = ${row.id}`;
  res.status(200).json({ ok: true });
}
