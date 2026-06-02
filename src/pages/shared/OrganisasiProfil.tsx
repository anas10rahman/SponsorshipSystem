import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";
import {
  ArrowLeft,
  FolderKanban,
  Wallet,
  Send,
  CheckCircle2,
  MapPin,
  FileText,
} from "lucide-react";

export default function OrganisasiProfil() {
  const { id } = useParams();
  const { state, currentUser } = useStore();
  const navigate = useNavigate();

  const orgId = id ?? currentUser?.orgId ?? "";
  const org = state.organizations.find((o) => o.id === orgId);

  const isSelf = currentUser?.role === "org" && currentUser?.orgId === orgId;
  const canSeeSensitive = currentUser?.role === "admin" || isSelf;
  const isFunderViewer = currentUser?.role === "funder";

  const data = useMemo(() => {
    if (!org) return null;
    const proposals = state.proposals.filter((p) => p.orgId === org.id);
    const publicProposals = proposals.filter(
      (p) => p.status === "aktif" || p.status === "tercapai",
    );
    const totalRaised = proposals.reduce((s, p) => s + p.raised, 0);
    const pengajuan = state.pengajuan.filter((p) => p.orgId === org.id);
    const approved = pengajuan.filter((p) => p.status === "disetujui").length;
    return { proposals, publicProposals, totalRaised, pengajuanCount: pengajuan.length, approved };
  }, [org, state.proposals, state.pengajuan]);

  if (!org) {
    return (
      <>
        <Topbar title="Profil organisasi" />
        <div className="sh-shell__content">
          <Empty
            title="Organisasi tidak ditemukan"
            action={
              <button className="sh-btn sh-btn--secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Kembali
              </button>
            }
          />
        </div>
      </>
    );
  }

  const title = isSelf ? "Profil saya" : "Profil organisasi";

  return (
    <>
      <Topbar title={title} />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle="Informasi organisasi dan rekam jejak proposal."
          actions={
            <div className="sh-row" style={{ gap: 8 }}>
              <button className="sh-btn sh-btn--secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Kembali
              </button>
              {isSelf && (
                <Link to="/org/pengaturan" className="sh-btn sh-btn--primary">
                  Edit profil
                </Link>
              )}
            </div>
          }
        />

        {/* Header */}
        <section className="sh-card" style={{ marginBottom: 20 }}>
          <div className="sh-card__body">
            <div className="sh-row" style={{ gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              <span
                className="sh-org-logo"
                style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}
              >
                {org.logoInitials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sh-row" style={{ gap: 10, flexWrap: "wrap" }}>
                  <h2>{org.name}</h2>
                  {org.verified ? (
                    <StatusBadge kind="custom" label="Terverifikasi" variant="success" />
                  ) : (
                    <StatusBadge kind="custom" label="Belum terverifikasi" variant="pending" />
                  )}
                </div>
                <div className="sh-row" style={{ gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <span className="sh-chip" style={{ cursor: "default" }}>
                    {org.category}
                  </span>
                  <span className="sh-muted sh-row" style={{ gap: 4 }}>
                    <MapPin size={14} /> {org.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="sh-stat-grid">
          <StatCard
            label="Total terkumpul"
            value={formatRupiah(data?.totalRaised ?? 0)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Proposal publik"
            value={data?.publicProposals.length ?? 0}
            icon={<FolderKanban size={20} />}
          />
          <StatCard
            label="Pengajuan dikirim"
            value={data?.pengajuanCount ?? 0}
            icon={<Send size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={data?.approved ?? 0}
            icon={<CheckCircle2 size={20} />}
          />
        </div>

        {/* Sensitive info — admin / self only */}
        {canSeeSensitive && (
          <section className="sh-card" style={{ marginBottom: 20 }}>
            <header className="sh-card__header">
              <h3>Informasi internal</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Hanya terlihat oleh organisasi & admin
              </span>
            </header>
            <div className="sh-card__body sh-stack">
              <div className="sh-row" style={{ gap: 32, flexWrap: "wrap" }}>
                <div>
                  <div className="sh-meta-label">Rekening pencairan</div>
                  <div className="sh-meta-value">{org.payoutAccount}</div>
                </div>
                {isSelf && (
                  <div>
                    <div className="sh-meta-label">Saldo</div>
                    <div className="sh-meta-value num">{formatRupiah(org.balance)}</div>
                  </div>
                )}
              </div>
              <div>
                <div className="sh-meta-label">Dokumen legal</div>
                {org.legalDocs.length > 0 ? (
                  <div className="sh-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    {org.legalDocs.map((d) => (
                      <span key={d} className="sh-btn sh-btn--ghost sh-btn--sm" style={{ cursor: "default" }}>
                        <FileText size={14} />
                        {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="sh-muted">Belum ada dokumen.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Public proposals */}
        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Proposal publik</h2>
          </header>
          {data && data.publicProposals.length > 0 ? (
            <div style={{ padding: 16 }}>
              <div className="sh-proposal-grid">
                {data.publicProposals.map((p) => {
                  const pct = percent(p.raised, p.target);
                  const card = (
                    <article className="sh-proposal" style={{ height: "100%" }}>
                      <div className="sh-proposal__header">
                        <div>
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
                    </article>
                  );
                  return isFunderViewer ? (
                    <Link
                      key={p.id}
                      to={`/funder/proposal/${p.id}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {card}
                    </Link>
                  ) : (
                    <div key={p.id}>{card}</div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="sh-card__body">
              <p className="sh-muted">Belum ada proposal publik.</p>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
