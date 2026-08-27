import type { ProposalStatus, TransactionStatus } from "@/lib/types";

type Variant = "success" | "pending" | "failed" | "info" | "neutral";

const TX_MAP: Record<TransactionStatus, { label: string; variant: Variant }> = {
  menunggu: { label: "Pending", variant: "pending" },
  diproses: { label: "Processing", variant: "info" },
  disalurkan: { label: "Disbursed", variant: "success" },
  ditolak: { label: "Rejected", variant: "failed" },
};

const PROP_MAP: Record<ProposalStatus, { label: string; variant: Variant }> = {
  draf: { label: "Draft", variant: "neutral" },
  aktif: { label: "Active", variant: "info" },
  tercapai: { label: "Fulfilled", variant: "success" },
  arsip: { label: "Archived", variant: "neutral" },
};

type Props =
  | { kind: "tx"; status: TransactionStatus }
  | { kind: "proposal"; status: ProposalStatus }
  | { kind: "custom"; label: string; variant?: Variant };

export function StatusBadge(props: Props) {
  let label: string;
  let variant: Variant;

  if (props.kind === "tx") ({ label, variant } = TX_MAP[props.status]);
  else if (props.kind === "proposal") ({ label, variant } = PROP_MAP[props.status]);
  else {
    label = props.label;
    variant = props.variant ?? "neutral";
  }

  return <span className={`sh-badge sh-badge--${variant}`}>{label}</span>;
}
