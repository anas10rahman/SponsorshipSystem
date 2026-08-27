import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { RekeningValidator } from "@/components/RekeningValidator";
import { PhotoPicker } from "@/components/PhotoPicker";
import { DocPicker } from "@/components/DocPicker";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import { GantiPassword } from "@/components/GantiPassword";
import { useStore, useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";
import type { Organization } from "@/lib/types";
import { CITIES } from "@/lib/cities";
import {
  Save,
  Instagram,
  Music2,
  Globe,
  CreditCard,
  Mail,
} from "lucide-react";

export default function OrgPengaturan() {
  const { state, currentUser } = useStore();
  const { updateOrgProfile } = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const org = state.organizations.find((o) => o.id === currentUser?.orgId);

  const [form, setForm] = useState<Organization | null>(org ?? null);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  // Pratinjau attachment: { title, data|null(loading) }
  const [preview, setPreview] = useState<{ title: string; data: string | null } | null>(null);

  /* Foto PIC tidak ikut di /api/state (bisa 2MB). Ambil isinya saat halaman
     dibuka supaya pratinjau tampil dan tidak terhapus saat menyimpan. */
  useEffect(() => {
    if (!org?.id || !org.pic.hasPhoto) return;
    let alive = true;
    api
      .orgDoc(org.id, "picphoto")
      .then((d) => {
        if (alive && d) setForm((f) => (f ? { ...f, pic: { ...f.pic, photo: d } } : f));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [org?.id, org?.pic.hasPhoto]);

  if (!org || !form) return null;

  // Buka pratinjau: pakai data di memori (baru diunggah) atau ambil lazy dari server.
  const openPreview = async (kind: "compro" | "ktp" | "legal", title: string, index = 0) => {
    // Berkas yang baru dipilih sudah ada di memori; sisanya diambil dari server.
    const inMem =
      kind === "compro"
        ? form.comproData
        : kind === "ktp"
          ? form.pic.idDocData
          : form.legalDocs[index]?.data;
    if (inMem) {
      setPreview({ title, data: inMem });
      return;
    }
    setPreview({ title, data: null });
    const d = await api.orgDoc(org.id, kind, index).catch(() => null);
    setPreview({ title, data: d ?? "" });
  };

  const clearErr = (...keys: string[]) =>
    setErrors((prev) => {
      if (!prev.size) return prev;
      const n = new Set(prev);
      keys.forEach((k) => n.delete(k));
      return n;
    });
  const set = (patch: Partial<Organization>) => {
    setForm((f) => (f ? { ...f, ...patch } : f));
    clearErr(...Object.keys(patch));
  };
  const setPic = (patch: Partial<Organization["pic"]>) => {
    setForm((f) => (f ? { ...f, pic: { ...f.pic, ...patch } } : f));
    clearErr(...Object.keys(patch).map((k) => `pic.${k}`));
  };






  const save = async () => {
    // Kumpulkan field yang belum/ salah diisi → tandai merah (bukan toast).
    const errs = new Set<string>();
    const emailBad = (v: string) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
    if (!form.name.trim()) errs.add("name");
    if (!form.category.trim()) errs.add("category");
    if (!form.city.trim()) errs.add("city");
    if (emailBad(form.email)) errs.add("email"); // wajib & format valid
    if (!form.description.trim()) errs.add("description");
    if (!form.payoutAccount.trim()) errs.add("payoutAccount");
    if (!(form.comproUrl ?? "").trim()) errs.add("comproUrl");
    if (form.legalDocs.length === 0) errs.add("legalDocs");
    if (!form.pic.idDocUrl.trim()) errs.add("pic.idDocUrl");
    if (!form.pic.name.trim()) errs.add("pic.name");
    if (!form.pic.phone.trim()) errs.add("pic.phone");
    if (!form.pic.position.trim()) errs.add("pic.position");
    if (emailBad(form.pic.email)) errs.add("pic.email"); // wajib & format valid
    // Medsos: jika diisi, wajib berupa LINK (bukan username) & sesuai platform.
    const filled = (v?: string) => !!v && v.trim() !== "";
    const isUrl = (v: string) => /^https?:\/\/\S+\.\S+/i.test(v.trim());
    // Opsional: hanya divalidasi bentuknya bila memang diisi.
    if (filled(form.website) && !isUrl(form.website!)) errs.add("website");
    if (filled(form.instagram) && (!isUrl(form.instagram!) || !/instagram\.com|instagr\.am/i.test(form.instagram!)))
      errs.add("instagram");
    if (filled(form.tiktok) && (!isUrl(form.tiktok!) || !/tiktok\.com/i.test(form.tiktok!)))
      errs.add("tiktok");
    if (errs.size) {
      setErrors(errs);
      return; // border merah muncul di field terkait
    }
    setErrors(new Set());
    // Sinkronkan no.hp kontak ber-gate + inisial logo dari nama PIC & nama org.
    try {
      await updateOrgProfile({
        ...form,
        phone: form.pic.phone,
        logoInitials: initials(form.name),
      });
      navigate("/org/profil");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not save the profile."));
    }
  };

  return (
    <>
      <Topbar title="Organization settings" />
      <div className="sh-shell__content">
        <PageHead
          title="Edit organization profile"
          subtitle="Complete the organization profile and the person in charge (PIC)."
        />

        <div style={{ display: "grid", gap: 20, maxWidth: 880 }}>
          {/* ============ Profil organisasi ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Organization profile</h3>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <PhotoPicker
                label="Organization logo"
                value={form.logoUrl}
                fallback={form.logoInitials}
                onChange={(v) => set({ logoUrl: v })}
                size={96}
                hint="PNG/JPG, max 2 MB. If empty, the name initials are used."
              />

              <div className="sh-form-grid">
                <Field label="Organization name" required invalid={errors.has("name")}>
                  <input
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Misal: Yayasan Seni Budaya"
                  />
                </Field>
                <Field
                  label="Organization category"
                  required
                  hint="Organization focus area"
                  invalid={errors.has("category")}
                >
                  <input
                    value={form.category}
                    onChange={(e) => set({ category: e.target.value })}
                    placeholder="Misal: Seni & Budaya / Edukasi / Olahraga"
                  />
                </Field>
                <Field label="Organization email" required invalid={errors.has("email")}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="halo@organisasi.org"
                  />
                </Field>
                <Field label="City" required invalid={errors.has("city")}>
                  <select value={form.city} onChange={(e) => set({ city: e.target.value })}>
                    <option value="">— Select a city —</option>
                    {/* Kota tersimpan yang tak ada di daftar tetap tampil agar tidak hilang. */}
                    {(CITIES.includes(form.city) || !form.city
                      ? CITIES
                      : [form.city, ...CITIES]
                    ).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Payout account"
                  required
                  icon={<CreditCard size={14} />}
                  hint="Select a bank, type the number twice, then enter the holder name as printed in the passbook"
                  invalid={errors.has("payoutAccount")}
                >
                  <RekeningValidator
                    value={form.payoutAccount}
                    onChange={(v) => set({ payoutAccount: v })}
                    invalid={errors.has("payoutAccount")}
                    ownerHint={form.name}
                  />
                </Field>
                <div
                  className={`sh-field sh-field--wide${errors.has("description") ? " sh-field--invalid" : ""}`}
                >
                  <label className="sh-field__label">
                    Deskripsi organisasi <Req />
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Describe your organization's mission, focus, and main activities."
                  />
                </div>
              </div>
            </div>

            <div className="sh-form-section">
              <h4 style={{ marginBottom: 14 }}>Website & sosial media</h4>
              <div className="sh-form-grid">
                <Field
                  label="Website"
                  icon={<Globe size={14} />}
                  hint="Tempel link lengkap (https://…)"
                  invalid={errors.has("website")}
                >
                  <input
                    value={form.website ?? ""}
                    onChange={(e) => set({ website: e.target.value })}
                    placeholder="https://organisasi.org"
                  />
                </Field>
                <Field
                  label="Instagram"
                  icon={<Instagram size={14} />}
                  hint="Tempel link, bukan username"
                  invalid={errors.has("instagram")}
                >
                  <input
                    value={form.instagram ?? ""}
                    onChange={(e) => set({ instagram: e.target.value })}
                    placeholder="https://instagram.com/organisasi"
                  />
                </Field>
                <Field
                  label="TikTok"
                  icon={<Music2 size={14} />}
                  hint="Tempel link, bukan username"
                  invalid={errors.has("tiktok")}
                >
                  <input
                    value={form.tiktok ?? ""}
                    onChange={(e) => set({ tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@organisasi"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ============ Dokumen organisasi ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Organization documents</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                PDF · required for admin verification
              </span>
            </header>
            <div className="sh-card__body">
              <DocPicker
                label="Company profile (compro)"
                required
                docs={form.comproUrl ? [{ name: form.comproUrl, data: form.comproData }] : []}
                onChange={(docs) =>
                  set({ comproUrl: docs[0]?.name ?? "", comproData: docs[0]?.data })
                }
                onPreview={() => openPreview("compro", form.comproUrl!)}
                invalid={errors.has("comproUrl")}
              />

              <DocPicker
                label="Organization legal documents"
                required
                multiple
                docs={form.legalDocs}
                onChange={(docs) => set({ legalDocs: docs })}
                onPreview={(d, i) => openPreview("legal", d.name, i)}
                invalid={errors.has("legalDocs")}
                hint="Mis. akta pendirian, SK Kemenkumham, NPWP."
              />
            </div>
          </section>

          {/* ============ PIC organisasi ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Penanggung jawab (PIC)</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Main contact for coordination
              </span>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <PhotoPicker
                label="Foto PIC"
                value={form.pic.photo}
                fallback={initials(form.pic.name || "?")}
                // String kosong = minta hapus; undefined tak dipakai agar
                // server tahu bedanya "biarkan" dan "hapus".
                onChange={(v) => setPic({ photo: v ?? "" })}
                size={96}
                round
                hint="PNG/JPG, max 2 MB. If empty, the PIC name initials are used."
              />

              <div className="sh-form-grid">
                <Field label="PIC name" required invalid={errors.has("pic.name")}>
                  <input
                    value={form.pic.name}
                    onChange={(e) => setPic({ name: e.target.value })}
                    placeholder="Full name of the person in charge"
                  />
                </Field>
                <Field label="PIC WhatsApp number" required invalid={errors.has("pic.phone")}>
                  <input
                    value={form.pic.phone}
                    onChange={(e) => setPic({ phone: e.target.value })}
                    placeholder="0812-3456-7890"
                  />
                </Field>
                <Field label="Role in the organization" required invalid={errors.has("pic.position")}>
                  <input
                    value={form.pic.position}
                    onChange={(e) => setPic({ position: e.target.value })}
                    placeholder="Misal: Direktur Program"
                  />
                </Field>
                <Field
                  label="PIC email"
                  required
                  icon={<Mail size={14} />}
                  invalid={errors.has("pic.email")}
                >
                  <input
                    type="email"
                    value={form.pic.email}
                    onChange={(e) => setPic({ email: e.target.value })}
                    placeholder="nama@organisasi.org"
                  />
                </Field>
              </div>

              <div style={{ marginTop: 18 }}>
                <DocPicker
                  label="Upload KTP/KTM (PDF)"
                  required
                  docs={
                    form.pic.idDocUrl
                      ? [{ name: form.pic.idDocUrl, data: form.pic.idDocData }]
                      : []
                  }
                  onChange={(docs) =>
                    setPic({ idDocUrl: docs[0]?.name ?? "", idDocData: docs[0]?.data })
                  }
                  onPreview={() => openPreview("ktp", form.pic.idDocUrl)}
                  invalid={errors.has("pic.idDocUrl")}
                />
              </div>
            </div>
          </section>

          <div className="sh-row" style={{ justifyContent: "flex-end" }}>
            <button className="sh-btn sh-btn--primary" onClick={save}>
              <Save size={16} />
              Save profile
            </button>
          </div>

          <GantiPassword />
        </div>
      </div>

      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title={preview.title || "Document preview"}
          width={760}
        >
          {preview.data === null ? (
            <p className="sh-muted">Loading document…</p>
          ) : preview.data ? (
            <PdfPreview dataUrl={preview.data} fileName={preview.title} />
          ) : (
            <p className="sh-muted">The document could not be loaded.</p>
          )}
        </Modal>
      )}
    </>
  );
}

function Req() {
  return <span style={{ color: "var(--status-failed)" }}>*</span>;
}

function Field({
  label,
  required,
  hint,
  icon,
  invalid,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  invalid?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`sh-field${invalid ? " sh-field--invalid" : ""}`}>
      <label className="sh-field__label sh-row" style={{ gap: 6 }}>
        {icon}
        {label} {required && <Req />}
      </label>
      {children}
      {invalid ? (
        <span className="sh-field__hint" style={{ color: "var(--status-failed)" }}>
          Must be filled in correctly.
        </span>
      ) : (
        hint && <span className="sh-field__hint">{hint}</span>
      )}
    </div>
  );
}
