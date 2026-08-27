/* Kebijakan kata sandi kuat (sisi client) — HARUS sama dengan api/_password.ts.
   Server tetap sumber kebenaran; ini untuk validasi & feedback langsung di UI. */

export const PASSWORD_MIN = 8;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least  characters.`;
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw))
    return "Password must contain at least one special character (e.g. ! @ # $ %).";
  return null;
}

/** Daftar aturan + status terpenuhi — untuk checklist live di form. */
export function passwordRules(pw: string): { label: string; ok: boolean }[] {
  return [
    { label: `At least ${PASSWORD_MIN} characters`, ok: pw.length >= PASSWORD_MIN },
    { label: "One uppercase letter (A-Z)", ok: /[A-Z]/.test(pw) },
    { label: "One lowercase letter (a-z)", ok: /[a-z]/.test(pw) },
    { label: "One number (0-9)", ok: /[0-9]/.test(pw) },
    { label: "One special character (!@#$…)", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}
