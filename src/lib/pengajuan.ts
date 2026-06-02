import type { PengajuanStatus } from "./types";

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
