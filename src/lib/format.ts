/* Helper format Bahasa Indonesia — PRD §11 Format. */

const rupiahFmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | null | undefined): string {
  return rupiahFmt.format(Number(value || 0)).replace("Rp", "Rp ");
}

export function formatRupiahShort(value: number): string {
  const v = Number(value || 0);
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)} M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)} Jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)} rb`;
  return formatRupiah(v);
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return String(value);
  return dateFmt.format(d);
}

/** Tanggal dari <input type="date"> (YYYY-MM-DD) → "20 Desember 2026".
 *  Diparse sebagai waktu lokal agar tidak bergeser akibat timezone. */
export function formatEventDate(value: string | null | undefined): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return dateFmt.format(d);
  }
  return value; // fallback untuk data lama berupa teks bebas
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return String(value);
  return dateTimeFmt.format(d);
}

export function nowIso(): string {
  return new Date().toISOString();
}

/* ID readable dengan prefix: TRX-YYYY-MMDD-XXXX / PGJ-YYYY-MMDD-XXXX */
function makePrefixedId(prefix: string, seq?: number): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const tail = String(seq ?? Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
  return `${prefix}-${y}-${m}${day}-${tail}`;
}

export function makeTransactionId(seq?: number): string {
  return makePrefixedId("TRX", seq);
}

export function makePengajuanId(seq?: number): string {
  return makePrefixedId("PGJ", seq);
}

export function percent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

export function initials(name: string, max = 2): string {
  return name
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, max)
    .toUpperCase();
}
