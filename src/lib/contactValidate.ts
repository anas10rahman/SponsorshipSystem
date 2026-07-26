/** Validasi & normalisasi kontak: nomor telepon/WhatsApp, website, Instagram.
 *
 *  Prinsipnya ramah isian: pengguna boleh menulis "@nama", "nama",
 *  "instagram.com/nama", atau URL penuh — semuanya dinormalkan jadi tautan
 *  utuh saat disimpan, sehingga tampilan profil selalu bisa diklik. */

/* ---------------- Telepon / WhatsApp ---------------- */

/** Sisakan digit; 08xx → 628xx (format yang dipakai wa.me). */
export function normalizePhone(v: string): string {
  let d = String(v || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("620")) d = "62" + d.slice(3);
  else if (!d.startsWith("62")) d = "62" + d;
  return d;
}

/** Kembalikan pesan error, atau null bila nomor wajar untuk WhatsApp Indonesia. */
export function validatePhone(v: string): string | null {
  const raw = String(v || "").trim();
  if (!raw) return "Nomor telepon/WhatsApp wajib diisi.";
  if (/[a-zA-Z]/.test(raw)) return "Nomor telepon hanya boleh berisi angka.";
  const d = normalizePhone(raw);
  // 62 + 9..13 digit → total 11..15
  if (d.length < 11 || d.length > 15) return "Nomor telepon tidak wajar (contoh: 0812-3456-7890).";
  if (!/^628/.test(d)) return "Gunakan nomor seluler Indonesia (diawali 08 atau +628).";
  return null;
}

/** Tampilan rapi: 628123456789 → +62 812-3456-789 */
export function prettyPhone(v: string): string {
  const d = normalizePhone(v);
  if (d.length < 11) return v;
  const rest = d.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
}

/* ---------------- Website ---------------- */

/** "brand.co.id" → "https://brand.co.id". Kosong → "". */
export function normalizeWebsite(v: string): string {
  const s = String(v || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

export function validateWebsite(v: string): string | null {
  const s = String(v || "").trim();
  if (!s) return null; // opsional
  const url = normalizeWebsite(s);
  // Wajib punya titik + TLD, tanpa spasi.
  if (/\s/.test(url)) return "Alamat website tidak boleh mengandung spasi.";
  if (!/^https?:\/\/[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(url))
    return "Alamat website tidak valid (contoh: https://brand.co.id).";
  return null;
}

/* ---------------- Instagram ---------------- */

/** Ambil username dari "@nama", "nama", atau URL instagram apa pun. */
export function instagramHandle(v: string): string {
  let s = String(v || "").trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const m = /^(?:instagram\.com|instagr\.am)\/([^/?#]+)/i.exec(s);
  if (m) s = m[1];
  return s.replace(/^@/, "").replace(/\/+$/, "").trim();
}

/** Apa pun bentuk isiannya → "https://instagram.com/nama". Kosong → "". */
export function normalizeInstagram(v: string): string {
  const h = instagramHandle(v);
  return h ? `https://instagram.com/${h}` : "";
}

export function validateInstagram(v: string): string | null {
  const s = String(v || "").trim();
  if (!s) return null; // opsional
  // Tautan platform lain jelas keliru → tolak, jangan diam-diam diubah.
  const host = s.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(host) && !/^(instagram\.com|instagr\.am)\//i.test(host))
    return "Tautan itu bukan Instagram. Isi username atau tautan Instagram.";
  const h = instagramHandle(s);
  if (!/^[A-Za-z0-9._]{1,30}$/.test(h))
    return "Username Instagram tidak valid (huruf, angka, titik, garis bawah).";
  return null;
}
