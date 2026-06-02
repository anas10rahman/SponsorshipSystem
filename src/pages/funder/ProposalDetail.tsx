import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah, percent } from "@/lib/format";
import { ArrowLeft, Send, FileText } from "lucide-react";

const PRESET_AMOUNTS = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

export default function FunderProposalDetail() {
  const { id } = useParams();
  const { state, currentUser } = useStore();
  const { createTransaction } = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const funderId = currentUser?.funderId ?? "";
  const funder = state.funders.find((f) => f.id === funderId);
  const proposal = state.proposals.find((p) => p.id === id);
  const org = useMemo(
    () => (proposal ? state.organizations.find((o) => o.id === proposal.orgId) : null),
    [proposal, state.organizations],
  );

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(10_000_000);

  if (!proposal || !funder) {
    return (
      <>
        <Topbar title="Detail proposal" />
        <div className="sh-shell__content">
          <Empty
            title="Proposal tidak ditemukan"
            action={
              <Link to="/funder/jelajahi" className="sh-btn sh-btn--primary">
                <ArrowLeft size={16} />
                Kembali ke daftar
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const remaining = Math.max(0, proposal.target - proposal.raised);
  const pct = percent(proposal.raised, proposal.target);

  const submit = () => {
    if (amount <= 0) {
      toast.failed("Nominal harus lebih dari 0.");
      return;
    }
    if (amount > remaining) {
      toast.failed(`Nominal melebihi sisa target (${formatRupiah(remaining)}).`);
      return;
    }
    if (amount > funder.budgetRemaining) {
      toast.failed(
        `Sisa anggaran Anda hanya ${formatRupiah(funder.budgetRemaining)}.`,
      );
      return;
    }
    const tx = createTransaction({
      proposalId: proposal.id,
      orgId: proposal.orgId,
      funderId,
      amount,
    });
    toast.success(`Dana ${formatRupiah(amount)} disalurkan. Transaksi ${tx.id} menunggu verifikasi.`);
    setOpen(false);
    navigate("/funder/portofolio");
  };

  return (
    <>
      <Topbar title={proposal.title} />
      <div className="sh-shell__content">
        <PageHead
          title={proposal.title}
          subtitle={`${proposal.category} · ${proposal.city}`}
          actions={
            <Link to="/funder/jelajahi" className="sh-btn sh-btn--secondary">
              <ArrowLeft size={16} />
              Kembali
            </Link>
          }
        />

        <div className="sh-detail-layout">
          <div className="sh-detail-stack">
            <section className="sh-card">
              <div className="sh-card__body sh-stack">
                <div className="sh-row" style={{ gap: 16 }}>
                  <span className="sh-org-logo" style={{ width: 56, height: 56, fontSize: 18 }}>
                    {org?.logoInitials ?? "—"}
                  </span>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{org?.name}</h3>
                    <div className="sh-muted">
                      {org?.category} · {org?.city}
                      {org?.verified && (
                        <>
                          {" "}
                          ·{" "}
                          <StatusBadge
                            kind="custom"
                            label="Terverifikasi"
                            variant="success"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="sh-meta-label">Deskripsi</div>
                  <p>{proposal.description}</p>
                </div>
                <div>
                  <div className="sh-meta-label">Benefit untuk pendana</div>
                  <ul style={{ margin: "8px 0 0 18px" }}>
                    {proposal.benefits.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
                {proposal.proposalDocUrl && (
                  <div>
                    <div className="sh-meta-label">Dokumen pendukung</div>
                    <button className="sh-btn sh-btn--ghost sh-btn--sm">
                      <FileText size={14} />
                      {proposal.proposalDocUrl}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="sh-stack">
            <section className="sh-card">
              <div className="sh-card__body sh-stack">
                <div>
                  <div className="sh-meta-label">Status</div>
                  <div style={{ marginTop: 4 }}>
                    <StatusBadge kind="proposal" status={proposal.status} />
                  </div>
                </div>
                <div>
                  <div className="sh-meta-label">Progress</div>
                  <div className="sh-progress" style={{ marginTop: 6 }}>
                    <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="sh-progress__meta">
                    <span>{formatRupiah(proposal.raised)}</span>
                    <span>dari {formatRupiah(proposal.target)}</span>
                  </div>
                </div>
                <div>
                  <div className="sh-meta-label">Sisa kebutuhan</div>
                  <div className="sh-meta-value num">{formatRupiah(remaining)}</div>
                </div>
                <div>
                  <div className="sh-meta-label">Pendukung</div>
                  <div className="sh-meta-value">{proposal.supporters.length} pendana</div>
                </div>

                <button
                  className="sh-btn sh-btn--primary"
                  onClick={() => setOpen(true)}
                  disabled={proposal.status !== "aktif" || remaining === 0}
                >
                  <Send size={16} />
                  Salurkan dana
                </button>
                {proposal.status !== "aktif" && (
                  <div className="sh-notice">
                    Proposal ini tidak menerima dana saat ini ({proposal.status}).
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Salurkan dana"
        footer={
          <>
            <button className="sh-btn sh-btn--secondary" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button className="sh-btn sh-btn--primary" onClick={submit}>
              <Send size={16} />
              Konfirmasi penyaluran
            </button>
          </>
        }
      >
        <div className="sh-stack">
          <div>
            <div className="sh-meta-label">Proposal</div>
            <div className="sh-meta-value">{proposal.title}</div>
          </div>
          <div className="sh-row" style={{ gap: 24, flexWrap: "wrap" }}>
            <div>
              <div className="sh-meta-label">Sisa kebutuhan</div>
              <div className="sh-meta-value num">{formatRupiah(remaining)}</div>
            </div>
            <div>
              <div className="sh-meta-label">Sisa anggaran Anda</div>
              <div className="sh-meta-value num">{formatRupiah(funder.budgetRemaining)}</div>
            </div>
          </div>

          <div className="sh-field">
            <label className="sh-field__label">Nominal penyaluran (Rp)</label>
            <input
              type="number"
              min={0}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`sh-chip${amount === preset ? " is-active" : ""}`}
                onClick={() => setAmount(preset)}
                disabled={preset > Math.min(remaining, funder.budgetRemaining)}
              >
                {formatRupiah(preset)}
              </button>
            ))}
          </div>

          <div className="sh-notice sh-notice--info">
            Dana akan ditahan (escrow) dan dirilis ke organisasi setelah Admin memverifikasi.
          </div>
        </div>
      </Modal>
    </>
  );
}
