import type { Pengajuan, PengajuanStatus } from "./types";
import { formatRupiah } from "./format";

/** Biaya yang dipotong dari saldo organisasi saat mengirim pengajuan baru. */
export const SUBMISSION_FEE = 50_000;

/** Nominal final = harga paket yang dipilih pendana. 0 bila belum ada yang dipilih. */
export function selectedAmount(p: Pengajuan): number {
  if (p.selectedPackage == null) return 0;
  return p.packages[p.selectedPackage]?.amount ?? 0;
}

/** Nominal yang dihitung untuk laporan/total (hanya berarti bila sudah disetujui). */
export function approvedAmount(p: Pengajuan): number {
  return p.status === "disetujui" ? selectedAmount(p) : 0;
}

/** Label nominal untuk kolom daftar: harga paket terpilih, atau rentang harga paket. */
export function pengajuanAmountLabel(p: Pengajuan): string {
  if (p.selectedPackage != null) return formatRupiah(selectedAmount(p));
  const amounts = (p.packages ?? []).map((pk) => pk.amount).filter((n) => n > 0);
  if (amounts.length === 0) return "—";
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  return min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`;
}

/** Label ringkas jumlah paket untuk kolom "Paket". */
export function packageCountLabel(p: Pengajuan): string {
  const n = (p.packages ?? []).length;
  return n === 0 ? "—" : `${n} paket`;
}

/** Kontak (no.hp) lawan baru terbuka setelah ada pengajuan terkirim
 *  (status apa pun selain draf) di antara org & pendana tersebut. */
export function hasPengajuanBetween(
  pengajuan: Pengajuan[],
  orgId: string | undefined,
  funderId: string | undefined,
): boolean {
  if (!orgId || !funderId) return false;
  return pengajuan.some(
    (p) => p.orgId === orgId && p.funderId === funderId && p.status !== "draf",
  );
}

/** "0812-3456-7890" → "0812••••7890" (mask tengah, sisakan 4 depan & 4 belakang). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "••••••••";
  const head = digits.slice(0, 4);
  const tail = digits.slice(-4);
  return `${head}••••${tail}`;
}

type BadgeVariant = "success" | "pending" | "failed" | "info" | "neutral";

const MAP: Record<PengajuanStatus, { label: string; variant: BadgeVariant }> = {
  draf: { label: "Draf", variant: "neutral" },
  diajukan: { label: "Diajukan", variant: "info" },
  perlu_revisi: { label: "Perlu revisi", variant: "pending" },
  disetujui: { label: "Disetujui", variant: "success" },
  ditolak: { label: "Ditolak", variant: "failed" },
};

export function pengajuanBadge(status: PengajuanStatus) {
  return MAP[status];
}
