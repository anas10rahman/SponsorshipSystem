import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ContactLine } from "@/components/ContactLine";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import { hasPengajuanBetween, pengajuanBadge } from "@/lib/pengajuan";
import {
  ArrowLeft,
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const orgId = id ?? currentUser?.orgId ?? "";
  const org = state.organizations.find((o) => o.id === orgId);

  const isSelf = currentUser?.role === "org" && currentUser?.orgId === orgId;
  const canSeeSensitive = currentUser?.role === "admin" || isSelf;
  const isFunderViewer = currentUser?.role === "funder";

  const canSeeContact =
    canSeeSensitive ||
    (isFunderViewer && hasPengajuanBetween(state.pengajuan, orgId, currentUser?.funderId));

  const data = useMemo(() => {
    if (!org) return null;
    const all = state.pengajuan.filter((p) => p.orgId === org.id && p.status !== "draf");
    const approved = all.filter((p) => p.status === "disetujui");
    const totalApproved = approved
      .filter((p) => p.type === "in_cash")
      .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);
    // Daftar rinci: admin/self lihat semua; pendana hanya riwayat dengan dirinya.
    const visible = isFunderViewer
      ? all.filter((p) => p.funderId === currentUser?.funderId)
      : all;
    return { sent: all.length, approvedCount: approved.length, totalApproved, visible };
  }, [org, state.pengajuan, isFunderViewer, currentUser?.funderId]);

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
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar title={title} />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle="Informasi organisasi dan rekam jejak pengajuan."
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
                <ContactLine
                  phone={org.phone}
                  canSee={canSeeContact}
                  hint="Nomor tampil setelah organisasi mengajukan ke Anda."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="sh-stat-grid">
          <StatCard
            label="Total disetujui (in-cash)"
            value={formatRupiah(data?.totalApproved ?? 0)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Pengajuan dikirim"
            value={data?.sent ?? 0}
            icon={<Send size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={data?.approvedCount ?? 0}
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

        {/* Riwayat pengajuan */}
        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Riwayat pengajuan</h2>
            {isFunderViewer && (
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Hanya pengajuan ke Anda
              </span>
            )}
          </header>
          {data && data.visible.length > 0 ? (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    {!isFunderViewer && <th>Pendana</th>}
                    <th>Jenis</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.visible.map((p) => {
                    const funder = state.funders.find((f) => f.id === p.funderId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.eventName}</td>
                        {!isFunderViewer && <td>{funder?.name ?? "—"}</td>}
                        <td>{p.type === "in_cash" ? "In-Cash" : "In-Kind"}</td>
                        <td className="num">
                          {p.type === "in_cash"
                            ? formatRupiah(p.requestedAmount ?? 0)
                            : `${(p.inKindItems ?? []).length} barang`}
                        </td>
                        <td>
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td className="sh-muted">{formatDate(p.updatedAt)}</td>
                        <td>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => setSelectedId(p.id)}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="sh-card__body">
              <p className="sh-muted">Belum ada pengajuan.</p>
            </div>
          )}
        </section>
      </div>

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
