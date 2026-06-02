import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah, percent } from "@/lib/format";
import type { Proposal, ProposalStatus } from "@/lib/types";
import { Plus, Edit3, Archive, ArchiveRestore, Eye } from "lucide-react";

const FILTERS: Array<{ value: "semua" | ProposalStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "draf", label: "Draf" },
  { value: "aktif", label: "Aktif" },
  { value: "tercapai", label: "Tercapai" },
  { value: "arsip", label: "Arsip" },
];

export default function OrgProposal() {
  const { state, currentUser } = useStore();
  const { saveProposal } = useActions();
  const toast = useToast();
  const orgId = currentUser?.orgId;

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");

  const rows = useMemo(() => {
    const mine = state.proposals.filter((p) => p.orgId === orgId);
    return filter === "semua" ? mine : mine.filter((p) => p.status === filter);
  }, [state.proposals, orgId, filter]);

  const counts = useMemo(() => {
    const mine = state.proposals.filter((p) => p.orgId === orgId);
    const c: Record<string, number> = { semua: mine.length };
    for (const s of ["draf", "aktif", "tercapai", "arsip"] as const) {
      c[s] = mine.filter((p) => p.status === s).length;
    }
    return c;
  }, [state.proposals, orgId]);

  const setStatus = (p: Proposal, status: ProposalStatus, msg: string) => {
    saveProposal({ ...p, status, updatedAt: new Date().toISOString() });
    toast.success(msg);
  };

  return (
    <>
      <Topbar title="Proposal saya" />
      <div className="sh-shell__content">
        <PageHead
          title="Proposal saya"
          subtitle="Kelola proposal dari draf, publikasi, sampai pendanaan tercapai."
          actions={
            <Link to="/org/proposal/baru" className="sh-btn sh-btn--primary">
              <Plus size={16} />
              Buat proposal
            </Link>
          }
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="sh-muted" style={{ fontWeight: 600 }}>
                ({counts[f.value] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty
            title="Belum ada proposal"
            description="Mulai dengan membuat proposal pendanaan."
            action={
              <Link to="/org/proposal/baru" className="sh-btn sh-btn--primary">
                <Plus size={16} />
                Buat proposal
              </Link>
            }
          />
        ) : (
          <div className="sh-proposal-grid">
            {rows.map((p) => {
              const pct = percent(p.raised, p.target);
              return (
                <article key={p.id} className="sh-proposal">
                  <div className="sh-proposal__header">
                    <div style={{ minWidth: 0 }}>
                      <div className="sh-proposal__title">{p.title}</div>
                      <div className="sh-proposal__org">
                        {p.category} · {p.city}
                      </div>
                    </div>
                    <StatusBadge kind="proposal" status={p.status} />
                  </div>

                  <div className="sh-progress">
                    <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="sh-progress__meta">
                    <span>{formatRupiah(p.raised)}</span>
                    <span>dari {formatRupiah(p.target)}</span>
                  </div>

                  <div className="sh-row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <Link
                      to={`/org/proposal/${p.id}`}
                      className="sh-btn sh-btn--secondary sh-btn--sm"
                    >
                      <Eye size={14} />
                      Detail
                    </Link>
                    {p.status === "draf" && (
                      <button
                        className="sh-btn sh-btn--primary sh-btn--sm"
                        onClick={() => setStatus(p, "aktif", `Proposal "${p.title}" dipublikasikan.`)}
                      >
                        Publikasikan
                      </button>
                    )}
                    {p.status === "aktif" && (
                      <Link
                        to={`/org/proposal/${p.id}/edit`}
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                      >
                        <Edit3 size={14} />
                        Edit
                      </Link>
                    )}
                    {(p.status === "aktif" || p.status === "tercapai") && (
                      <button
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        onClick={() => setStatus(p, "arsip", `Proposal diarsipkan.`)}
                      >
                        <Archive size={14} />
                        Arsipkan
                      </button>
                    )}
                    {p.status === "arsip" && (
                      <button
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        onClick={() => setStatus(p, "aktif", `Proposal diaktifkan kembali.`)}
                      >
                        <ArchiveRestore size={14} />
                        Aktifkan
                      </button>
                    )}
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
