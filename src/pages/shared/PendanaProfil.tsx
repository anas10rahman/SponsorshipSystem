import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, initials, waLink, gmailLink } from "@/lib/format";
import {
  hasPengajuanBetween,
  maskPhone,
  selectedAmount,
} from "@/lib/pengajuan";
import {
  instagramHandle,
  normalizeInstagram,
  normalizeWebsite,
} from "@/lib/contactValidate";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  HandCoins,
  Instagram,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Send,
  UserRound,
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

  // Kontak terbuka untuk: diri sendiri, admin, atau org yang sudah mengajukan ke mitra sponsor ini.
  const canSeeContact =
    isSelf ||
    currentUser?.role === "admin" ||
    (isOrgViewer && hasPengajuanBetween(state.pengajuan, currentUser?.orgId, funderId));

  if (!funder) {
    return (
      <>
        <Topbar />
        <div className="sh-shell__content">
          <Empty
            title="Mitra Sponsor tidak ditemukan"
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

  const title = isSelf ? "Profil saya" : "Profil mitra sponsor";

  return (
    <>
      <Topbar />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle="Informasi profil mitra sponsor."
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

        {/* Identitas mitra sponsor: logo besar, nama, chip tipe & fokus,
            deskripsi, lalu baris kontak yang bisa langsung diklik. */}
        <section className="sh-card dm-prof" style={{ marginBottom: 20 }}>
          <div className="dm-prof__logo">
            {funder.logoUrl ? (
              <img src={funder.logoUrl} alt={funder.name} />
            ) : (
              <span>{initials(funder.name)}</span>
            )}
          </div>

          <div className="dm-prof__main">
            <div
              className="sh-row"
              style={{ gap: 12, flexWrap: "wrap", justifyContent: "space-between" }}
            >
              <h2 className="dm-prof__name">{funder.name}</h2>
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

            <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
              <StatusBadge kind="custom" label={funder.type} variant="info" />
              {funder.focus.map((f) => (
                <span key={f} className="sh-chip" style={{ cursor: "default" }}>
                  {f}
                </span>
              ))}
            </div>

            <p className="dm-prof__desc">
              {funder.description || "Belum ada deskripsi."}
            </p>

            <div className="dm-prof__contacts">
              {canSeeContact ? (
                <a
                  className="dm-contact"
                  href={gmailLink(funder.email)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Mail size={17} />
                  {funder.email || "—"}
                </a>
              ) : (
                <span className="dm-contact dm-contact--locked">
                  <Lock size={16} />
                  Email terbuka setelah pengajuan
                </span>
              )}

              {funder.phone &&
                (canSeeContact ? (
                  <a
                    className="dm-contact dm-contact--wa"
                    href={waLink(funder.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    <MessageCircle size={17} />
                    {funder.phone}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    {maskPhone(funder.phone)}
                  </span>
                ))}

              {funder.website && (
                <a
                  className="dm-contact"
                  href={normalizeWebsite(funder.website)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Globe size={17} />
                  {funder.website.replace(/^https?:\/\//i, "")}
                </a>
              )}

              {funder.instagram && (
                <a
                  className="dm-contact"
                  href={normalizeInstagram(funder.instagram)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Instagram size={17} />
                  @{instagramHandle(funder.instagram)}
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Penanggung jawab (PIC) */}
        <section className="sh-card dm-pic" style={{ marginBottom: 20 }}>
          <div className="dm-pic__head">
            <span className="dm-pic__head-icon">
              <UserRound size={20} />
            </span>
            <h3>Penanggung Jawab (PIC)</h3>
          </div>
          <div className="dm-pic__body">
            {/* Sistem belum menyimpan foto PIC — dipakai inisial nama. */}
            <span className="dm-pic__avatar">{initials(funder.pic.name || "?")}</span>
            <div style={{ minWidth: 0 }}>
              <h4 className="dm-pic__name">{funder.pic.name || "—"}</h4>
              <div className="dm-pic__role">{funder.pic.position || "Jabatan belum diisi"}</div>
              <div className="dm-pic__lines">
                {canSeeContact ? (
                  <a
                    className="dm-contact dm-contact--wa"
                    href={waLink(funder.pic.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    <Phone size={16} />
                    {funder.pic.phone || "—"}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    {maskPhone(funder.pic.phone)}
                  </span>
                )}
                {canSeeContact ? (
                  <a
                    className="dm-contact"
                    href={gmailLink(funder.pic.email)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Mail size={16} />
                    {funder.pic.email || "—"}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    Email terbuka setelah pengajuan
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats — hanya untuk pihak lain yang menilai brand ini. Di profil
            sendiri angka ini mubazir: sudah ada di Dashboard & Portofolio.
            Nominal dana tetap disembunyikan dari sisi organisasi. */}
        {!isSelf && (
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
        )}

      </div>
    </>
  );
}
