import { Phone, Lock } from "lucide-react";
import { maskPhone } from "@/lib/pengajuan";

type Props = {
  phone: string;
  canSee: boolean;
  /** Hint yang tampil saat nomor masih di-mask. */
  hint?: string;
};

/** Baris kontak no.hp dengan gating: nomor penuh hanya bila canSee. */
export function ContactLine({ phone, canSee, hint }: Props) {
  if (!phone) return null;
  return (
    <div
      className="sh-row"
      style={{ gap: 8, marginTop: 10, color: "var(--ink-700)", flexWrap: "wrap" }}
    >
      {canSee ? (
        <>
          <Phone size={15} style={{ color: "var(--status-success)" }} />
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {phone}
          </a>
        </>
      ) : (
        <>
          <Lock size={15} style={{ color: "var(--ink-300)" }} />
          <span style={{ fontWeight: 600, color: "var(--ink-500)", letterSpacing: "0.04em" }}>
            {maskPhone(phone)}
          </span>
          <span className="sh-muted" style={{ fontSize: 12 }}>
            {hint ?? "Nomor terbuka setelah ada pengajuan."}
          </span>
        </>
      )}
    </div>
  );
}
