import { randomInt } from "node:crypto";

/** Masa berlaku kode OTP (menit). */
export const OTP_TTL_MIN = 15;

/** True bila provider email (Resend) sudah dikonfigurasi. */
export function hasEmailProvider(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/** Kode OTP 6 digit. */
export function makeOtp(): string {
  return String(randomInt(100000, 1000000));
}

/** Kirim email berisi kode verifikasi via Resend HTTP API (tanpa SDK). */
export async function sendVerificationEmail(
  to: string,
  code: string,
): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "no_provider" };
  const from = process.env.MAIL_FROM || "SponsorHub <onboarding@resend.dev>";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
      <h2 style="margin:0 0 8px">Verifikasi email SponsorHub</h2>
      <p style="color:#555;margin:0 0 20px">Masukkan kode berikut untuk menyelesaikan pendaftaran. Kode berlaku ${OTP_TTL_MIN} menit.</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f2f2f7;border-radius:12px;padding:18px 0;color:#4f46e5">${code}</div>
      <p style="color:#999;font-size:12px;margin:20px 0 0">Abaikan email ini jika Anda tidak mendaftar di SponsorHub.</p>
    </div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to,
        subject: `Kode verifikasi SponsorHub: ${code}`,
        html,
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return { ok: false, error: `resend ${r.status}: ${t.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}
