import type { ProposalStatus, TransactionStatus } from "@/lib/types";

type Variant = "success" | "pending" | "failed" | "info" | "neutral";

const TX_MAP: Record<TransactionStatus, { label: string; variant: Variant }> = {
  menunggu: { label: "Menunggu", variant: "pending" },
  diproses: { label: "Diproses", variant: "info" },
  disalurkan: { label: "Disalurkan", variant: "success" },
  ditolak: { label: "Ditolak", variant: "failed" },
};

const PROP_MAP: Record<ProposalStatus, { label: string; variant: Variant }> = {
  draf: { label: "Draf", variant: "neutral" },
  aktif: { label: "Aktif", variant: "info" },
  tercapai: { label: "Tercapai", variant: "success" },
  arsip: { label: "Arsip", variant: "neutral" },
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
