import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, initials, percent } from "@/lib/format";
import {
  hasPengajuanBetween,
  maskPhone,
  pengajuanAmountLabel,
  packageCountLabel,
  selectedAmount,
} from "@/lib/pengajuan";
import { ContactLine } from "@/components/ContactLine";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Building2,
  HandCoins,
  Mail,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Phone,
  Lock,
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
    const totalDisbursed = approved.reduce((s, p) => s + selectedAmount(p), 0);
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
            <div className="sh-row" style={{ gap: 8 }}>
              <button className="sh-btn sh-btn--secondary" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Kembali
              </button>
              {isSelf && (
                <Link to="/funder/pengaturan" className="sh-btn sh-btn--primary">
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
              {funder.logoUrl ? (
                <img
                  src={funder.logoUrl}
                  alt={funder.name}
                  className="sh-org-logo"
                  style={{ width: 64, height: 64, objectFit: "cover", padding: 0, flexShrink: 0 }}
                />
              ) : (
                <span
                  className="sh-org-logo"
                  style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}
                >
                  {initials(funder.name)}
                </span>
              )}
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

        {/* Tentang pendana */}
        <section className="sh-card" style={{ marginBottom: 20 }}>
          <header className="sh-card__header">
            <h3>Tentang pendana</h3>
          </header>
          <div className="sh-card__body sh-stack">
            {funder.description ? (
              <p>{funder.description}</p>
            ) : (
              <p className="sh-muted">Belum ada deskripsi.</p>
            )}

            <div className="sh-row" style={{ gap: 32, flexWrap: "wrap" }}>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Mail size={13} /> Email
                </div>
                {canSeeContact ? (
                  <a href={`mailto:${funder.email}`} className="sh-meta-value">
                    {funder.email || "—"}
                  </a>
                ) : (
                  <div className="sh-meta-value sh-row" style={{ gap: 6, color: "var(--ink-500)" }}>
                    <Lock size={13} /> Terbuka setelah pengajuan
                  </div>
                )}
              </div>
              {funder.website && (
                <div>
                  <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                    <Globe size={13} /> Website
                  </div>
                  <div className="sh-meta-value">{funder.website}</div>
                </div>
              )}
            </div>

            {(funder.instagram || funder.twitter || funder.facebook) && (
              <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
                {funder.instagram && (
                  <span className="sh-chip" style={{ cursor: "default" }}>
                    <Instagram size={14} /> {funder.instagram}
                  </span>
                )}
                {funder.twitter && (
                  <span className="sh-chip" style={{ cursor: "default" }}>
                    <Twitter size={14} /> {funder.twitter}
                  </span>
                )}
                {funder.facebook && (
                  <span className="sh-chip" style={{ cursor: "default" }}>
                    <Facebook size={14} /> {funder.facebook}
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Penanggung jawab (PIC) */}
        <section className="sh-card" style={{ marginBottom: 20 }}>
          <header className="sh-card__header">
            <h3>Penanggung jawab (PIC)</h3>
          </header>
          <div className="sh-card__body">
            <div className="sh-row" style={{ gap: 32, flexWrap: "wrap" }}>
              <div>
                <div className="sh-meta-label">Nama</div>
                <div className="sh-meta-value">{funder.pic.name || "—"}</div>
              </div>
              <div>
                <div className="sh-meta-label">Jabatan</div>
                <div className="sh-meta-value">{funder.pic.position || "—"}</div>
              </div>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Phone size={13} /> Nomor WA
                </div>
                {canSeeContact ? (
                  <a
                    href={`tel:${funder.pic.phone.replace(/\D/g, "")}`}
                    className="sh-meta-value"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {funder.pic.phone || "—"}
                  </a>
                ) : (
                  <div className="sh-meta-value sh-row" style={{ gap: 6, color: "var(--ink-500)" }}>
                    <Lock size={13} /> {maskPhone(funder.pic.phone)}
                  </div>
                )}
              </div>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Mail size={13} /> Email
                </div>
                {canSeeContact ? (
                  <a href={`mailto:${funder.pic.email}`} className="sh-meta-value">
                    {funder.pic.email || "—"}
                  </a>
                ) : (
                  <div className="sh-meta-value sh-row" style={{ gap: 6, color: "var(--ink-500)" }}>
                    <Lock size={13} /> Terbuka setelah pengajuan
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats — informasi dana pendana disembunyikan dari sisi organisasi */}
        <div className="sh-stat-grid">
          <StatCard
            label="Pengajuan disetujui"
            value={stats?.approved.length ?? 0}
            icon={<CheckCircle2 size={20} />}
          />
          {!isOrgViewer && (
            <StatCard
              label="Total disalurkan"
              value={formatRupiah(stats?.totalDisbursed ?? 0)}
              icon={<HandCoins size={20} />}
            />
          )}
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
                      <th>Paket</th>
                      {!isOrgViewer && <th>Nilai</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.approved.map((p) => {
                      const org = state.organizations.find((o) => o.id === p.orgId);
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600 }}>{p.eventName}</td>
                          <td>{org?.name ?? "—"}</td>
                          <td>{packageCountLabel(p)}</td>
                          {!isOrgViewer && (
                            <td className="num">{pengajuanAmountLabel(p)}</td>
                          )}
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

          {/* Kapasitas anggaran — privat: hanya pendana sendiri yang bisa melihat */}
          {isSelf && (
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
          )}
        </div>
      </div>
    </>
  );
}
