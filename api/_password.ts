/* Kebijakan kata sandi kuat — dipakai bersama oleh register & reset password.
   Aturan: minimal 8 karakter + huruf kapital + huruf kecil + angka + karakter
   spesial. Kembalikan pesan error (Bahasa Indonesia) atau null bila valid. */

export const PASSWORD_MIN = 8;

export function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`;
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(pw))
    return "Password must contain at least one special character (e.g. ! @ # $ %).";
  return null;
}
