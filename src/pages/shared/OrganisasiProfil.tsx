import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import { api } from "@/lib/api";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { ContactLine } from "@/components/ContactLine";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate, initials, waLink, gmailLink } from "@/lib/format";
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
  MessageCircle,
  Landmark,
  UserRound,
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

  /* Pratinjau lampiran: data tidak ikut di /api/state, jadi diambil saat dibuka. */
  const [doc, setDoc] = useState<{ title: string; data: string | null } | null>(null);
  const openDoc = async (kind: "ktp" | "legal", title: string, index = 0) => {
    setDoc({ title, data: null });
    const d = await api.orgDoc(org!.id, kind, index).catch(() => null);
    setDoc({ title, data: d ?? "" });
  };

  const title = isSelf ? "Profil saya" : "Profil organisasi";

  return (
    <>
      <Topbar />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle="Informasi profil organisasi."
          actions={
            <div className="sh-row" style={{ gap: 8 }}>
              {isSelf && (
                <Link to="/org/pengaturan" className="sh-btn sh-btn--primary">
                  Edit profil
                </Link>
              )}
            </div>
          }
        />

        {/* Identitas organisasi — logo besar, nama, chip, deskripsi, kontak. */}
        <section className="sh-card dm-prof" style={{ marginBottom: 20 }}>
          <div className="dm-prof__logo">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt={org.name} />
            ) : (
              <span>{org.logoInitials}</span>
            )}
          </div>

          <div className="dm-prof__main">
            <div className="sh-row" style={{ gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <h2 className="dm-prof__name" style={{ margin: 0 }}>
                {org.name}
              </h2>
              {org.verified ? (
                <StatusBadge kind="custom" label="Terverifikasi" variant="success" />
              ) : (
                <StatusBadge kind="custom" label="Belum terverifikasi" variant="pending" />
              )}
            </div>

            <div className="sh-row" style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <span className="sh-chip" style={{ cursor: "default" }}>
                {org.category}
              </span>
              <span className="sh-chip" style={{ cursor: "default" }}>
                <MapPin size={14} /> {org.city}
              </span>
            </div>

            <p className="dm-prof__desc">{org.description || "Belum ada deskripsi."}</p>

            <div className="dm-prof__contacts">
              {canSeeContact ? (
                <a
                  className="dm-contact dm-contact--icon"
                  href={gmailLink(org.email)}
                  target="_blank"
                  rel="noreferrer"
                  title={org.email}
                  aria-label="Email"
                >
                  <Mail size={18} />
                </a>
              ) : (
                <span className="dm-contact dm-contact--locked">
                  <Lock size={16} />
                  Email terbuka setelah pengajuan
                </span>
              )}

              {org.phone &&
                (canSeeContact ? (
                  <a
                    className="dm-contact dm-contact--wa"
                    href={waLink(org.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    <MessageCircle size={17} />
                    {org.phone}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    {maskPhone(org.phone)}
                  </span>
                ))}

              {org.website && (
                <a
                  className="dm-contact dm-contact--icon"
                  href={org.website}
                  target="_blank"
                  rel="noreferrer"
                  title={org.website}
                  aria-label="Website"
                >
                  <Globe size={18} />
                </a>
              )}
              {org.instagram && (
                <a
                  className="dm-contact dm-contact--icon"
                  href={org.instagram}
                  target="_blank"
                  rel="noreferrer"
                  title={org.instagram}
                  aria-label="Instagram"
                >
                  <Instagram size={18} />
                </a>
              )}
              {org.tiktok && (
                <a
                  className="dm-contact dm-contact--icon"
                  href={org.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  title={org.tiktok}
                  aria-label="TikTok"
                >
                  <Music2 size={18} />
                </a>
              )}
            </div>

            {/* Berkas & rekening organisasi — hanya organisasi sendiri & admin. */}
            {canSeeSensitive && (
              <div className="dm-prof__internal">
                <div>
                  <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                    <Landmark size={13} /> Rekening pencairan
                  </div>
                  <div className="sh-meta-value">{org.payoutAccount || "—"}</div>
                </div>
                <div>
                  <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                    <FileText size={13} /> Dokumen legal organisasi
                  </div>
                  {org.legalDocs.length > 0 ? (
                    <div className="sh-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                      {org.legalDocs.map((d, i) => (
                        <button
                          key={d.name}
                          type="button"
                          className="sh-btn sh-btn--ghost sh-btn--sm"
                          onClick={() => openDoc("legal", d.name, i)}
                          title="Pratinjau dokumen"
                        >
                          <FileText size={14} />
                          {d.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="sh-muted" style={{ margin: "4px 0 0" }}>
                      Belum ada dokumen.
                    </p>
                  )}
                </div>
              </div>
            )}
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
            <span className="dm-pic__avatar">
              {org.pic.photo ? (
                <img src={org.pic.photo} alt={org.pic.name} />
              ) : (
                initials(org.pic.name || "?")
              )}
            </span>
            <div style={{ minWidth: 0 }}>
              <h4 className="dm-pic__name">{org.pic.name || "—"}</h4>
              <div className="dm-pic__role">{org.pic.position || "Jabatan belum diisi"}</div>
              <div className="dm-pic__lines">
                {canSeeContact ? (
                  <a
                    className="dm-contact dm-contact--wa"
                    href={waLink(org.pic.phone)}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    <Phone size={16} />
                    {org.pic.phone || "—"}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    {maskPhone(org.pic.phone)}
                  </span>
                )}
                {canSeeContact ? (
                  <a
                    className="dm-contact"
                    href={gmailLink(org.pic.email)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Mail size={16} />
                    {org.pic.email || "—"}
                  </a>
                ) : (
                  <span className="dm-contact dm-contact--locked">
                    <Lock size={16} />
                    Email terbuka setelah pengajuan
                  </span>
                )}
                {/* KTP/KTM menempel pada PIC — hanya organisasi sendiri & admin. */}
                {canSeeSensitive && (
                  <div style={{ marginTop: 4 }}>
                    <div className="sh-meta-label sh-row" style={{ gap: 6 }}>
                      <IdCard size={13} /> KTP/KTM penanggung jawab
                    </div>
                    {org.pic.idDocUrl ? (
                      <button
                        type="button"
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        style={{ marginTop: 4 }}
                        onClick={() => openDoc("ktp", org.pic.idDocUrl)}
                        title="Pratinjau dokumen"
                      >
                        <IdCard size={14} />
                        {org.pic.idDocUrl}
                      </button>
                    ) : (
                      <p className="sh-muted" style={{ margin: "4px 0 0" }}>
                        Belum diunggah.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </div>

      {doc && (
        <Modal open onClose={() => setDoc(null)} title={doc.title} width={760}>
          {doc.data === null ? (
            <p className="sh-muted">Memuat dokumen…</p>
          ) : doc.data ? (
            <PdfPreview dataUrl={doc.data} fileName={doc.title} />
          ) : (
            <p className="sh-muted">Dokumen tidak dapat dimuat.</p>
          )}
        </Modal>
      )}
    </>
  );
}
