/** Validasi rekening tingkat FORMAT (tanpa panggilan ke jaringan bank).
 *
 *  Catatan penting: mengecek nama pemilik rekening ("name inquiry") hanya bisa
 *  lewat penyedia berbayar (Flip/Xendit/Midtrans dsb) dan butuh akun bisnis.
 *  Selama itu belum dipasang, modul ini SENGAJA tidak pernah mengklaim sebuah
 *  rekening "terverifikasi" — ia hanya menangkap kesalahan ketik. Verifikasi
 *  kepemilikan tetap dilakukan admin lewat dokumen saat verifikasi organisasi. */

export type Bank = {
  name: string;
  /** Panjang digit yang lazim dipakai bank ini. Kosong = bebas (6–20). */
  lengths: number[];
};

/* Panjang di bawah memakai format yang lazim dipakai tiap bank. Bila sebuah
   bank ternyata punya format berbeda, pengguna bisa memilih "Bank lainnya"
   agar tidak terkunci oleh aturan yang terlalu ketat. */
export const BANKS: Bank[] = [
  { name: "BCA", lengths: [10] },
  { name: "Bank Mandiri", lengths: [13] },
  { name: "BNI", lengths: [10] },
  { name: "BRI", lengths: [15] },
  { name: "BTN", lengths: [16] },
  { name: "BSI", lengths: [10] },
  { name: "CIMB Niaga", lengths: [13] },
  { name: "Bank Danamon", lengths: [10] },
  { name: "Bank Permata", lengths: [10, 16] },
  { name: "Maybank", lengths: [10, 11] },
  { name: "OCBC", lengths: [12] },
  { name: "Panin", lengths: [10] },
  { name: "Bank Mega", lengths: [15] },
  { name: "Bank Jago", lengths: [10] },
  { name: "Bank Muamalat", lengths: [10] },
  { name: "Bank lainnya", lengths: [] },
];

export function findBank(name: string): Bank | undefined {
  return BANKS.find((b) => b.name === name);
}

/** Periksa format nomor rekening. Kembalikan pesan error, atau null bila lolos. */
export function validateAccountNumber(bankName: string, number: string): string | null {
  const digits = String(number || "").replace(/\D/g, "");
  if (!bankName) return "Pilih bank terlebih dahulu.";
  if (!digits) return "Nomor rekening wajib diisi.";
  const bank = findBank(bankName);
  if (!bank) return "Bank tidak dikenal.";

  // Deretan angka yang sama (0000000000) — hampir pasti salah ketik.
  if (/^(\d)\1+$/.test(digits)) return "Nomor rekening tidak wajar.";

  if (bank.lengths.length === 0) {
    if (digits.length < 6 || digits.length > 20)
      return "Nomor rekening tidak wajar (6–20 digit).";
    return null;
  }
  if (!bank.lengths.includes(digits.length)) {
    const expect = bank.lengths.join(" atau ");
    return `Nomor rekening ${bank.name} umumnya ${expect} digit — yang diisi ${digits.length} digit. Periksa lagi, atau pilih "Bank lainnya" bila formatnya memang berbeda.`;
  }
  return null;
}

/** Rakit string rekening tersimpan: "BANK NNNN a.n. OWNER". */
export function composeAccount(bank: string, number: string, owner: string): string {
  const digits = String(number).replace(/\D/g, "");
  const o = String(owner || "").trim();
  return o ? `${bank} ${digits} a.n. ${o}` : `${bank} ${digits}`;
}

/** Ambil nomor dari string tersimpan (best-effort). */
export function extractNumber(payoutAccount: string): string {
  const m = /(\d{6,})/.exec(String(payoutAccount || ""));
  return m ? m[1] : "";
}

/** Ambil nama bank dari string tersimpan (best-effort). */
export function extractBank(payoutAccount: string): string {
  const s = String(payoutAccount || "").trim().toUpperCase();
  // Cocokkan nama terpanjang dulu agar "BNI" tidak menang atas "BNI Syariah" dsb.
  const hit = [...BANKS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((b) => s.startsWith(b.name.toUpperCase()));
  return hit?.name ?? "";
}

/** Ambil nama pemilik dari string tersimpan (best-effort). */
export function extractOwner(payoutAccount: string): string {
  const m = /a\.n\.\s*(.+)$/i.exec(String(payoutAccount || ""));
  return m ? m[1].trim() : "";
}
