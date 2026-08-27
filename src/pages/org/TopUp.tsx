import { useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah } from "@/lib/format";
import { SUBMISSION_FEE } from "@/lib/pengajuan";
import { Wallet, Plus } from "lucide-react";

const PRESETS = [50_000, 100_000, 250_000, 500_000, 1_000_000];

export default function OrgTopUp() {
  const { state, currentUser } = useStore();
  const { topUpOrg } = useActions();
  const toast = useToast();

  const org = state.organizations.find((o) => o.id === currentUser?.orgId);
  const [amount, setAmount] = useState<number>(100_000);
  const [amountErr, setAmountErr] = useState(false);

  const balance = org?.balance ?? 0;

  const submit = async () => {
    if (amount <= 0) {
      setAmountErr(true);
      return;
    }
    try {
      await topUpOrg(amount);
      toast.success(`Balance topped up by ${formatRupiah(amount)}.`);
    } catch (e: any) {
      toast.failed(String(e?.message || "Top-up failed."));
    }
  };

  return (
    <>
      <Topbar title="Top up balance" />
      <div className="sh-shell__content">
        <PageHead
          title="Top up balance"
          subtitle="Top up the organization balance to cover proposal submission fees."
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Form top-up */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Choose an amount</h2>
            </header>
            <div className="sh-card__body sh-stack">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                  gap: 10,
                }}
              >
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    className={`sh-chip${amount === p ? " is-active" : ""}`}
                    style={{ justifyContent: "center", padding: "12px 10px" }}
                    onClick={() => setAmount(p)}
                  >
                    {formatRupiah(p)}
                  </button>
                ))}
              </div>

              <div className={`sh-field${amountErr ? " sh-field--invalid" : ""}`}>
                <label className="sh-field__label">Nominal lain (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={amount || ""}
                  onChange={(e) => {
                    setAmount(Number(e.target.value));
                    if (amountErr) setAmountErr(false);
                  }}
                  placeholder="Misal: 150000"
                />
                <span
                  className="sh-field__hint"
                  style={amountErr ? { color: "var(--status-failed)" } : undefined}
                >
                  {amountErr
                    ? "Enter a valid top-up amount (greater than 0)."
                    : "This top-up is simulated — no real payment is processed."}
                </span>
              </div>

              <div>
                <button className="sh-btn sh-btn--primary" onClick={submit}>
                  <Plus size={16} />
                  Top-up {formatRupiah(amount)}
                </button>
              </div>
            </div>
          </section>

          {/* Ringkasan saldo */}
          <aside className="sh-card">
            <div className="sh-card__body sh-stack">
              <div className="sh-row" style={{ gap: 12 }}>
                <span className="sh-stat__icon">
                  <Wallet size={20} />
                </span>
                <div>
                  <div className="sh-stat__label">Current balance</div>
                  <div className="sh-stat__value tabular">{formatRupiah(balance)}</div>
                </div>
              </div>
              <div className="sh-notice sh-notice--info">
                Setiap mengirim pengajuan proposal baru, saldo Anda dipotong{" "}
                <strong>{formatRupiah(SUBMISSION_FEE)}</strong> as the submission fee.
              </div>
              <div className="sh-muted" style={{ fontSize: 13 }}>
                Sisa kuota pengajuan ≈{" "}
                <strong>{Math.floor(balance / SUBMISSION_FEE)}</strong> pengajuan.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
