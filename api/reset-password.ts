import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, readBody } from "./_db.js";
import { validatePassword } from "./_password.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/* Step B reset password: kirim email + kode + kata sandi baru.
   Kode salah / email tak dikenal → pesan sama ("Kode salah atau kadaluarsa")
   agar tidak bocorkan keberadaan akun. Sukses → kode dihangus (sekali pakai). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    const code = String(b.code || "").trim();
    const password = String(b.password || "");

    if (!email || !code) throw new HttpError(400, "Email & kode wajib diisi.");
    // Validasi kekuatan kata sandi baru (server = sumber kebenaran).
    const pwErr = validatePassword(password);
    if (pwErr) throw new HttpError(400, pwErr);

    // Cek kode cocok + belum kadaluarsa dalam satu query.
    const rows = (await sql`
      select id,
             (reset_expires is not null and reset_expires < now()) as expired,
             (reset_code is not null and reset_code = crypt(${code}, reset_code)) as code_ok
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];

    // Pesan seragam untuk email tak dikenal / kode salah / kadaluarsa.
    if (!row || !row.code_ok || row.expired)
      throw new HttpError(400, "Kode salah atau sudah kadaluarsa. Minta kode baru.");

    await sql`
      update users set password_hash = crypt(${password}, gen_salt('bf')),
        reset_code = null, reset_expires = null
      where id = ${row.id}`;

    res.status(200).json({ ok: true });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
