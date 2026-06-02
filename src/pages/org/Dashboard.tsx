import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";
import { Wallet, FolderKanban, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function OrgDashboard() {
  const { state, currentUser } = useStore();
  const orgId = currentUser?.orgId;
  const myProposals = state.proposals.filter((p) => p.orgId === orgId);
  const terkumpul = myProposals.reduce((s, p) => s + p.raised, 0);
  const aktif = myProposals.filter((p) => p.status === "aktif").length;
  const supporterCount = new Set(myProposals.flatMap((p) => p.supporters)).size;

  return (
    <>
      <Topbar title="Dashboard Organisasi" />
      <div className="sh-shell__content">
        <PageHead
          title="Dashboard Organisasi"
          subtitle="Kelola proposal pendanaan dan pantau dukungan dari pendana."
          actions={
            <Link to="/org/proposal" className="sh-btn sh-btn--primary">
              Lihat proposal
              <ArrowRight size={16} />
            </Link>
          }
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total terkumpul"
            value={formatRupiah(terkumpul)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Proposal aktif"
            value={aktif}
            icon={<FolderKanban size={20} />}
          />
          <StatCard
            label="Pendana terlibat"
            value={supporterCount}
            icon={<Users size={20} />}
          />
        </div>

        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Proposal saya</h2>
          </header>
          {myProposals.length === 0 ? (
            <div className="sh-card__body">
              <p className="sh-muted">Belum ada proposal.</p>
            </div>
          ) : (
            <div style={{ padding: 16 }}>
              <div className="sh-proposal-grid">
                {myProposals.map((p) => {
                  const pct = percent(p.raised, p.target);
                  return (
                    <article key={p.id} className="sh-proposal">
                      <div className="sh-proposal__header">
                        <div>
                          <div className="sh-proposal__title">{p.title}</div>
                          <div className="sh-proposal__org">{p.category} · {p.city}</div>
                        </div>
                        <StatusBadge kind="proposal" status={p.status} />
                      </div>
                      <div className="sh-progress">
                        <div
                          className="sh-progress__bar"
                          style={{ width: `${pct}%` }}
                          aria-label={`Progress ${pct}%`}
                        />
                      </div>
                      <div className="sh-progress__meta">
                        <span>{formatRupiah(p.raised)} terkumpul</span>
                        <span>{formatRupiah(p.target)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
