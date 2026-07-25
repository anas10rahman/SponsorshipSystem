/* Kebijakan kata sandi kuat (sisi client) — HARUS sama dengan api/_password.ts.
   Server tetap sumber kebenaran; ini untuk validasi & feedback langsung di UI. */

export const PASSWORD_MIN = 8;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
  if (!/[A-Z]/.test(pw)) return "Kata sandi harus memuat minimal satu huruf kapital.";
  if (!/[a-z]/.test(pw)) return "Kata sandi harus memuat minimal satu huruf kecil.";
  if (!/[0-9]/.test(pw)) return "Kata sandi harus memuat minimal satu angka.";
  if (!/[^A-Za-z0-9]/.test(pw))
    return "Kata sandi harus memuat minimal satu karakter spesial (mis. ! @ # $ %).";
  return null;
}

/** Daftar aturan + status terpenuhi — untuk checklist live di form. */
export function passwordRules(pw: string): { label: string; ok: boolean }[] {
  return [
    { label: `Minimal ${PASSWORD_MIN} karakter`, ok: pw.length >= PASSWORD_MIN },
    { label: "Satu huruf kapital (A-Z)", ok: /[A-Z]/.test(pw) },
    { label: "Satu huruf kecil (a-z)", ok: /[a-z]/.test(pw) },
    { label: "Satu angka (0-9)", ok: /[0-9]/.test(pw) },
    { label: "Satu karakter spesial (!@#$…)", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}
