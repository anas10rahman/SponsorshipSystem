import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { ContactLine } from "@/components/ContactLine";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate, waLink, gmailLink } from "@/lib/format";
import {
  hasPengajuanBetween,
  maskPhone,
  pengajuanBadge,
  pengajuanAmountLabel,
  packageCountLabel,
  selectedAmount,
} from "@/lib/pengajuan";
import {
  ArrowLeft,
  MapPin,
  FileText,
  Mail,
  Globe,
  Instagram,
  Music2,
  Phone,
  Lock,
  IdCard,
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

  const canSeeContact =
    canSeeSensitive ||
    (isFunderViewer && hasPengajuanBetween(state.pengajuan, orgId, currentUser?.funderId));

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
              {org.logoUrl ? (
                <img
                  src={org.logoUrl}
                  alt={org.name}
                  className="sh-org-logo"
                  style={{ width: 64, height: 64, objectFit: "cover", padding: 0, flexShrink: 0 }}
                />
              ) : (
                <span
                  className="sh-org-logo"
                  style={{ width: 64, height: 64, fontSize: 22, flexShrink: 0 }}
                >
                  {org.logoInitials}
                </span>
              )}
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

        {/* Tentang organisasi */}
        <section className="sh-card" style={{ marginBottom: 20 }}>
          <header className="sh-card__header">
            <h3>Tentang organisasi</h3>
          </header>
          <div className="sh-card__body sh-stack">
            {org.description ? (
              <p>{org.description}</p>
            ) : (
              <p className="sh-muted">Belum ada deskripsi.</p>
            )}

            <div className="sh-row" style={{ gap: 32, flexWrap: "wrap" }}>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Mail size={13} /> Email
                </div>
                {canSeeContact ? (
                  <a
                    href={gmailLink(org.email)}
                    target="_blank"
                    rel="noreferrer"
                    className="sh-meta-value"
                  >
                    {org.email || "—"}
                  </a>
                ) : (
                  <div className="sh-meta-value sh-row" style={{ gap: 6, color: "var(--ink-500)" }}>
                    <Lock size={13} /> Terbuka setelah pengajuan
                  </div>
                )}
              </div>
              {org.website && (
                <div>
                  <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                    <Globe size={13} /> Website
                  </div>
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noreferrer"
                    className="sh-meta-value"
                  >
                    {org.website}
                  </a>
                </div>
              )}
            </div>

            {(org.instagram || org.tiktok) && (
              <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
                {org.instagram && (
                  <a
                    href={org.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="sh-chip"
                  >
                    <Instagram size={14} /> Instagram
                  </a>
                )}
                {org.tiktok && (
                  <a href={org.tiktok} target="_blank" rel="noreferrer" className="sh-chip">
                    <Music2 size={14} /> TikTok
                  </a>
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
                <div className="sh-meta-value">{org.pic.name || "—"}</div>
              </div>
              <div>
                <div className="sh-meta-label">Jabatan</div>
                <div className="sh-meta-value">{org.pic.position || "—"}</div>
              </div>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Phone size={13} /> Nomor WA
                </div>
                {canSeeContact ? (
                  <a
                    href={waLink(org.pic.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="sh-meta-value"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {org.pic.phone || "—"}
                  </a>
                ) : (
                  <div className="sh-meta-value sh-row" style={{ gap: 6, color: "var(--ink-500)" }}>
                    <Lock size={13} /> {maskPhone(org.pic.phone)}
                  </div>
                )}
              </div>
              <div>
                <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                  <Mail size={13} /> Email
                </div>
                {canSeeContact ? (
                  <a
                    href={gmailLink(org.pic.email)}
                    target="_blank"
                    rel="noreferrer"
                    className="sh-meta-value"
                  >
                    {org.pic.email || "—"}
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
                <div className="sh-meta-label">KTP/KTM penanggung jawab</div>
                {org.pic.idDocUrl ? (
                  <span
                    className="sh-btn sh-btn--ghost sh-btn--sm"
                    style={{ cursor: "default", marginTop: 6 }}
                  >
                    <IdCard size={14} />
                    {org.pic.idDocUrl}
                  </span>
                ) : (
                  <p className="sh-muted">Belum diunggah.</p>
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

      </div>
    </>
  );
}
