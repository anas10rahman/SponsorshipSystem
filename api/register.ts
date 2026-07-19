import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";
import { hasEmailProvider, makeOtp, sendVerificationEmail, OTP_TTL_MIN } from "./_email.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const FUNDER_TYPES = ["Korporasi", "Individu", "Filantropi", "Perbankan"];
// Anggaran awal pendana baru (bisa disesuaikan lewat profil nanti).
const DEFAULT_FUNDER_BUDGET = 1_000_000_000;

function initialsOf(name: string): string {
  const s = name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return s || "??";
}

/* Registrasi mandiri: buat entitas (organisasi/pendana) + akun login. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);
    const role = b.role;
    const name = String(b.name || "").trim();
    const username = String(b.username || "").trim();
    const password = String(b.password || "");
    const email = String(b.email || "").trim().toLowerCase();

    if (role !== "org" && role !== "funder")
      throw new HttpError(400, "Peran registrasi tidak valid.");
    if (!name || !username || !password || !email)
      throw new HttpError(400, "Nama, email, username, dan kata sandi wajib diisi.");
    if (!/^[a-zA-Z0-9._-]{3,}$/.test(username))
      throw new HttpError(400, "Username minimal 3 karakter (huruf/angka/._-, tanpa spasi).");
    if (password.length < 6)
      throw new HttpError(400, "Kata sandi minimal 6 karakter.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      throw new HttpError(400, "Format email tidak valid.");

    const dupU = (await sql`select 1 from users where username = ${username} limit 1`) as any[];
    if (dupU.length) throw new HttpError(409, "Username sudah dipakai. Coba yang lain.");
    const dupE = (await sql`select 1 from users where email = ${email} limit 1`) as any[];
    if (dupE.length) throw new HttpError(409, "Email sudah terdaftar.");

    const initials = initialsOf(name);
    // Bila provider email aktif: akun dibuat belum terverifikasi + kirim OTP.
    // Bila belum: fallback — akun langsung terverifikasi (perilaku lama).
    const provider = hasEmailProvider();
    const verified = !provider;
    let userId: string;

    if (role === "org") {
      const category = String(b.category || "").trim() || "Umum";
      const city = String(b.city || "").trim() || "-";
      const orgRows = (await sql`
        insert into organizations (name, category, city, logo_initials, payout_account, email)
        values (${name}, ${category}, ${city}, ${initials}, '', ${email})
        returning id`) as any[];
      const orgId = orgRows[0].id;
      const uRows = (await sql`
        insert into users (name, email, username, password_hash, role, org_id, email_verified)
        values (${name}, ${email}, ${username}, crypt(${password}, gen_salt('bf')), 'org', ${orgId}, ${verified})
        returning id`) as any[];
      userId = uRows[0].id;
    } else {
      const type = FUNDER_TYPES.includes(b.type) ? b.type : "Korporasi";
      const fRows = (await sql`
        insert into funders (name, type, budget_total, budget_remaining, email)
        values (${name}, ${type}, ${DEFAULT_FUNDER_BUDGET}, ${DEFAULT_FUNDER_BUDGET}, ${email})
        returning id`) as any[];
      const funderId = fRows[0].id;
      const uRows = (await sql`
        insert into users (name, email, username, password_hash, role, funder_id, email_verified)
        values (${name}, ${email}, ${username}, crypt(${password}, gen_salt('bf')), 'funder', ${funderId}, ${verified})
        returning id`) as any[];
      userId = uRows[0].id;
    }

    if (provider) {
      // Simpan kode OTP (di-hash) + kadaluarsa, lalu kirim email.
      const code = makeOtp();
      await sql`
        update users set verify_code = crypt(${code}, gen_salt('bf')),
          verify_expires = now() + make_interval(mins => ${OTP_TTL_MIN})
        where id = ${userId}`;
      const mail = await sendVerificationEmail(email, code);
      return res.status(200).json({
        needsVerification: true,
        email,
        emailSent: mail.ok,
        ...(mail.ok ? {} : { emailError: mail.error }),
      });
    }

    res.status(200).json({ userId, state: await assembleState() });
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
