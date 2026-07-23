import type { Organization, OrgVerificationStatus } from "./types";

/** Cek kelengkapan data pendaftaran organisasi (syarat "Ajukan verifikasi").
 *  Wajib: company profile, KTP/KTM PIC, rekening pencairan, data PIC lengkap. */
export function orgDataComplete(org: Organization): { complete: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!org.comproUrl?.trim()) missing.push("Company profile (compro)");
  if (!org.pic?.idDocUrl?.trim()) missing.push("KTP/KTM penanggung jawab");
  if (!org.payoutAccount?.trim()) missing.push("Rekening pencairan");
  const picOk =
    !!org.pic?.name?.trim() &&
    !!org.pic?.position?.trim() &&
    !!org.pic?.phone?.trim() &&
    !!org.pic?.email?.trim();
  if (!picOk) missing.push("Data PIC lengkap (nama, jabatan, WA, email)");
  return { complete: missing.length === 0, missing };
}

type BadgeVariant = "success" | "pending" | "failed" | "info" | "neutral";

const MAP: Record<OrgVerificationStatus, { label: string; variant: BadgeVariant }> = {
  belum_diajukan: { label: "Belum diverifikasi", variant: "neutral" },
  menunggu: { label: "Menunggu verifikasi", variant: "pending" },
  terverifikasi: { label: "Terverifikasi", variant: "success" },
  ditolak: { label: "Verifikasi ditolak", variant: "failed" },
};

export function orgVerifyBadge(status: OrgVerificationStatus) {
  return MAP[status] ?? MAP.belum_diajukan;
}
