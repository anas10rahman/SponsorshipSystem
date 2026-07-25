import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, readBody } from "./_db.js";
import { makeOtp, sendResetEmail, hasEmailProvider, OTP_TTL_MIN } from "./_email.js";

/* Step A reset password: minta kode OTP ke email.
   Anti user-enumeration: SELALU balas { ok: true } dengan pesan netral, apa pun
   hasilnya. Email hanya dikirim bila akun benar-benar ada. Rate-limit senyap
   (30 detik) supaya tidak jadi mesin spam — juga tanpa bocorkan status email. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Pesan netral yang selalu ditampilkan ke client.
  const neutral = {
    ok: true,
    message: "Jika email terdaftar, kami telah mengirim kode reset. Cek inbox/spam Anda.",
  };

  try {
    const b = readBody(req);
    const email = String(b.email || "").trim().toLowerCase();
    // Email kosong/format aneh: tetap balas netral (jangan bocorkan apa pun).
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(200).json(neutral);
    if (!hasEmailProvider()) return res.status(200).json(neutral);

    // Cari akun + cek boleh kirim ulang (rate-limit 30 dtk vs reset_expires terakhir).
    const rows = (await sql`
      select id,
             (reset_expires is null
               or reset_expires - make_interval(mins => ${OTP_TTL_MIN}) < now() - interval '30 seconds'
             ) as can_send
      from users where email = ${email} limit 1`) as any[];
    const row = rows[0];

    // Kirim hanya bila akun ada & belum kena rate-limit. Selain itu: diam-diam skip.
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
