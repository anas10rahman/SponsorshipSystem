/** MOCK validasi rekening untuk demo. Ganti fungsi ini dengan panggilan API
 *  name-inquiry asli (Flip/Xendit/dll) saat produksi — UI tak perlu berubah. */

type AccountInfo = { bank: string; owner: string };

// Beberapa nomor "terdaftar" contoh untuk demo.
const REGISTERED: Record<string, AccountInfo> = {
  "1234567890": { bank: "BCA", owner: "Yayasan Seni Budaya" },
  "0987654321": { bank: "Bank Mandiri", owner: "Panitia UNAS Fest" },
  "1122334455": { bank: "BNI", owner: "Himpunan Mahasiswa Informatika" },
  "5566778899": { bank: "BRI", owner: "Komunitas Kreatif Nusantara" },
  "2233445566": { bank: "CIMB Niaga", owner: "Sinergi Nusantara" },
};

const BANKS = [
  "BCA",
  "Bank Mandiri",
  "BNI",
  "BRI",
  "CIMB Niaga",
  "BSI",
  "Bank Permata",
  "Bank Danamon",
];

/** Simulasi cek nomor rekening (demo).
 *  - Nomor contoh terdaftar → info spesifik.
 *  - Nomor lain dengan format valid (>=6 digit) → dianggap valid; bank
 *    ditentukan deterministik, pemilik = ownerHint (nama organisasi).
 *  - Terlalu pendek / kosong → null (dianggap salah).
 *  Ganti fungsi ini dengan API name-inquiry asli saat produksi. */
export function validateAccount(number: string, ownerHint?: string): AccountInfo | null {
  const digits = String(number || "").replace(/\D/g, "");
  if (digits.length < 6) return null;
  if (REGISTERED[digits]) return REGISTERED[digits];
  const sum = [...digits].reduce((s, c) => s + Number(c), 0);
  return { bank: BANKS[sum % BANKS.length], owner: ownerHint?.trim() || "Pemilik terverifikasi" };
}

/** Nomor-nomor contoh (untuk keperluan demo). */
export const DEMO_ACCOUNTS = Object.keys(REGISTERED);

/** Rakit string rekening tersimpan: "BANK NNNN a.n. OWNER". */
export function composeAccount(bank: string, number: string, owner: string): string {
  return `${bank} ${String(number).replace(/\D/g, "")} a.n. ${owner}`;
}

/** Ambil nomor dari string tersimpan (best-effort). */
export function extractNumber(payoutAccount: string): string {
  const m = /(\d{6,})/.exec(String(payoutAccount || ""));
  return m ? m[1] : "";
}
