import type { Organization, OrgVerificationStatus } from "./types";

/** Checks whether an organization has everything required to request
 *  verification: company profile, PIC ID document, payout account, PIC details. */
export function orgDataComplete(org: Organization): { complete: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!org.comproUrl?.trim()) missing.push("Company profile (compro)");
  if (!org.pic?.idDocUrl?.trim()) missing.push("PIC ID document (KTP/KTM)");
  if (!org.payoutAccount?.trim()) missing.push("Payout account");
  const picOk =
    !!org.pic?.name?.trim() &&
    !!org.pic?.position?.trim() &&
    !!org.pic?.phone?.trim() &&
    !!org.pic?.email?.trim();
  if (!picOk) missing.push("Complete PIC details (name, role, WhatsApp, email)");
  return { complete: missing.length === 0, missing };
}

type BadgeVariant = "success" | "pending" | "failed" | "info" | "neutral";

const MAP: Record<OrgVerificationStatus, { label: string; variant: BadgeVariant }> = {
  belum_diajukan: { label: "Not verified", variant: "neutral" },
  menunggu: { label: "Verification pending", variant: "pending" },
  terverifikasi: { label: "Verified", variant: "success" },
  ditolak: { label: "Verification rejected", variant: "failed" },
};

export function orgVerifyBadge(status: OrgVerificationStatus) {
  return MAP[status] ?? MAP.belum_diajukan;
}
