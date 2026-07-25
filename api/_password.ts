/* Kebijakan kata sandi kuat — dipakai bersama oleh register & reset password.
   Aturan: minimal 8 karakter + huruf kapital + huruf kecil + angka + karakter
   spesial. Kembalikan pesan error (Bahasa Indonesia) atau null bila valid. */

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
