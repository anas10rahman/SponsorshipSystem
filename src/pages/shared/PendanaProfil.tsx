import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, initials, percent } from "@/lib/format";
import { hasPengajuanBetween } from "@/lib/pengajuan";
import { ContactLine } from "@/components/ContactLine";
import {
  ArrowLeft,
  Send,
  Wallet,
  CheckCircle2,
  Building2,
  HandCoins,
} from "lucide-react";

export default function PendanaProfil() {
  const { id } = useParams();
  const { state, currentUser } = useStore();
  const navigate = useNavigate();

  const funderId = id ?? currentUser?.funderId ?? "";
  const funder = state.funders.find((f) => f.id === funderId);

  const isSelf = currentUser?.role === "funder" && currentUser?.funderId === funderId;
  const isOrgViewer = currentUser?.role === "org";

  const stats = useMemo(() => {
    if (!funder) return null;
    const approved = state.pengajuan.filter(
      (p) => p.funderId === funder.id && p.status === "disetujui",
    );
    const totalDisbursed = approved
      .filter((p) => p.type === "in_cash")
      .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);
    const orgs = new Set(approved.map((p) => p.orgId));
    return { approved, totalDisbursed, orgsFunded: orgs.size };
  }, [funder, state.pengajuan]);

  // Kontak terbuka untuk: diri sendiri, admin, atau org yang sudah mengajukan ke pendana ini.
  const canSeeContact =
    isSelf ||
    currentUser?.role === "admin" ||
    (isOrgViewer && hasPengajuanBetween(state.pengajuan, currentUser?.orgId, funderId));

  if (!funder) {
    return (
      <>
        <Topbar title="Profil pendana" />
        <div className="sh-shell__content">
          <Empty
            title="Pendana tidak ditemukan"
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

  const used = funder.budgetTotal - funder.budgetRemaining;
  const usedPct = percent(used, funder.budgetTotal);
  const title = isSelf ? "Profil saya" : "Profil pendana";

  return (
    <>
      <Topbar title={title} />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle="Informasi pendana dan rekam jejak pendanaan."
          actions={
            <button className="sh-btn sh-btn--secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
              Kembali
            </button>
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
                {initials(funder.name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ marginBottom: 8 }}>{funder.name}</h2>
                <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <StatusBadge kind="custom" label={funder.type} variant="info" />
                  {funder.focus.map((f) => (
                    <span key={f} className="sh-chip" style={{ cursor: "default" }}>
                      {f}
                    </span>
                  ))}
                </div>
                <ContactLine
                  phone={funder.phone}
                  canSee={canSeeContact}
                  hint="Nomor tampil setelah Anda mengajukan ke pendana ini."
                />
              </div>
              {isOrgViewer && (
                <Link
                  to={`/org/pengajuan/baru?funder=${funder.id}`}
                  className="sh-btn sh-btn--primary"
                >
                  <Send size={16} />
                  Ajukan proposal
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="sh-stat-grid">
          <StatCard
            label="Sisa anggaran"
            value={formatRupiah(funder.budgetRemaining)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={stats?.approved.length ?? 0}
            icon={<CheckCircle2 size={20} />}
          />
          <StatCard
            label="Total disalurkan"
            value={formatRupiah(stats?.totalDisbursed ?? 0)}
            icon={<HandCoins size={20} />}
          />
          <StatCard
            label="Organisasi didanai"
            value={stats?.orgsFunded ?? 0}
            icon={<Building2 size={20} />}
          />
        </div>

        <div className="sh-detail-layout">
          {/* Rekam jejak */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Rekam jejak pendanaan</h2>
            </header>
            {stats && stats.approved.length > 0 ? (
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Organisasi</th>
                      <th>Jenis</th>
                      <th>Nilai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.approved.map((p) => {
                      const org = state.organizations.find((o) => o.id === p.orgId);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.eventName}</td>
                          <td>{org?.name ?? "—"}</td>
                          <td>{p.type === "in_cash" ? "In-Cash" : "In-Kind"}</td>
                          <td className="num">
                            {p.type === "in_cash"
                              ? formatRupiah(p.requestedAmount ?? 0)
                              : `${(p.inKindItems ?? []).length} barang`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sh-card__body">
                <p className="sh-muted">Belum ada pendanaan yang disetujui.</p>
              </div>
            )}
          </section>

          {/* Kapasitas anggaran */}
          <aside className="sh-card">
            <header className="sh-card__header">
              <h3>Kapasitas anggaran</h3>
            </header>
            <div className="sh-card__body sh-stack">
              <div>
                <div className="sh-meta-label">Anggaran total</div>
                <div className="sh-meta-value num">{formatRupiah(funder.budgetTotal)}</div>
              </div>
              <div>
                <div className="sh-progress">
                  <div className="sh-progress__bar" style={{ width: `${usedPct}%` }} />
                </div>
                <div className="sh-progress__meta">
                  <span>{formatRupiah(used)} terpakai</span>
                  <span>{usedPct}%</span>
                </div>
              </div>
              <div>
                <div className="sh-meta-label">Sisa anggaran</div>
                <div className="sh-meta-value num">{formatRupiah(funder.budgetRemaining)}</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
