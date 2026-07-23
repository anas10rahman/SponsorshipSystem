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

/** Simulasi cek nomor rekening. Kembalikan info bila terdaftar, atau null. */
export function validateAccount(number: string): AccountInfo | null {
  const digits = String(number || "").replace(/\D/g, "");
  return REGISTERED[digits] ?? null;
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
