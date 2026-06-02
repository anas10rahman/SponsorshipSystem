import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";
import { Banknote, Building2, Wallet, ArrowRight } from "lucide-react";

export default function FunderPortofolio() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";
  const funder = state.funders.find((f) => f.id === funderId);

  const myTx = useMemo(
    () => state.transactions.filter((t) => t.funderId === funderId),
    [state.transactions, funderId],
  );

  const proposalIds = useMemo(() => new Set(myTx.map((t) => t.proposalId)), [myTx]);
  const proposals = useMemo(
    () => state.proposals.filter((p) => proposalIds.has(p.id)),
    [state.proposals, proposalIds],
  );
  const orgIds = useMemo(() => new Set(proposals.map((p) => p.orgId)), [proposals]);

  const totalDisbursed = myTx
    .filter((t) => t.status === "disalurkan")
    .reduce((s, t) => s + t.amount, 0);
  const totalCommitted = myTx
    .filter((t) => t.status !== "ditolak")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Topbar title="Portofolio sponsor" />
      <div className="sh-shell__content">
        <PageHead
          title="Portofolio sponsor"
          subtitle="Proposal yang sudah Anda dukung & ringkasan komitmen."
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disponsori"
            value={formatRupiah(totalDisbursed)}
            icon={<Banknote size={20} />}
          />
          <StatCard
            label="Total komitmen"
            value={formatRupiah(totalCommitted)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Organisasi didanai"
            value={orgIds.size}
            icon={<Building2 size={20} />}
          />
          {funder && (
            <StatCard
              label="Sisa anggaran"
              value={formatRupiah(funder.budgetRemaining)}
              icon={<Wallet size={20} />}
            />
          )}
        </div>

        {proposals.length === 0 ? (
          <Empty
            title="Belum ada proposal yang Anda dukung"
            description="Mulai dari halaman Jelajahi."
            action={
              <Link to="/funder/jelajahi" className="sh-btn sh-btn--primary">
                Jelajahi proposal
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <div className="sh-proposal-grid">
            {proposals.map((p) => {
              const org = state.organizations.find((o) => o.id === p.orgId);
              const myCommit = myTx
                .filter((t) => t.proposalId === p.id && t.status !== "ditolak")
                .reduce((s, t) => s + t.amount, 0);
              const pct = percent(p.raised, p.target);
              return (
                <article key={p.id} className="sh-proposal">
                  <div className="sh-proposal__header">
                    <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
                      <span className="sh-org-logo">{org?.logoInitials ?? "—"}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="sh-proposal__title">{p.title}</div>
                        <div className="sh-proposal__org">{org?.name}</div>
                      </div>
                    </div>
                    <StatusBadge kind="proposal" status={p.status} />
                  </div>

                  <div className="sh-progress">
                    <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="sh-progress__meta">
                    <span>{formatRupiah(p.raised)}</span>
                    <span>{formatRupiah(p.target)}</span>
                  </div>

                  <div className="sh-row sh-row--between">
                    <div>
                      <div className="sh-meta-label">Komitmen saya</div>
                      <div className="sh-meta-value num">{formatRupiah(myCommit)}</div>
                    </div>
                    <Link
                      to={`/funder/proposal/${p.id}`}
                      className="sh-btn sh-btn--ghost sh-btn--sm"
                    >
                      Detail
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
