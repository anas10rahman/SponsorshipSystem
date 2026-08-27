import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore, useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { GantiPassword } from "@/components/GantiPassword";
import { PhotoPicker } from "@/components/PhotoPicker";
import { DocPicker } from "@/components/DocPicker";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import { api } from "@/lib/api";
import { initials } from "@/lib/format";
import {
  normalizeInstagram,
  normalizeWebsite,
  validateInstagram,
  validatePhone,
  validateWebsite,
} from "@/lib/contactValidate";
import type { Funder, FunderType } from "@/lib/types";
import {
  Save,
  Instagram,
  Globe,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const TYPES: FunderType[] = ["Korporasi", "Individu", "Filantropi", "Perbankan"];

export default function FunderPengaturan() {
  const { state, currentUser } = useStore();
  const { updateFunderProfile } = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const funder = state.funders.find((f) => f.id === currentUser?.funderId);

  const [form, setForm] = useState<Funder | null>(funder ?? null);
  const [focusText, setFocusText] = useState((funder?.focus ?? []).join(", "));
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{ title: string; data: string | null } | null>(null);

  if (!funder || !form) return null;

  /* Pratinjau lampiran: berkas yang baru dipilih ada di memori, sisanya lazy. */
  const openPreview = async (kind: "compro" | "legal", title: string, index = 0) => {
    const inMem = kind === "compro" ? form.comproData : form.legalDocs[index]?.data;
    if (inMem) {
      setPreview({ title, data: inMem });
      return;
    }
    setPreview({ title, data: null });
    const d = await api.funderDoc(funder.id, kind, index).catch(() => null);
    setPreview({ title, data: d ?? "" });
  };

  const set = (patch: Partial<Funder>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setPic = (patch: Partial<Funder["pic"]>) =>
    setForm((f) => (f ? { ...f, pic: { ...f.pic, ...patch } } : f));


  const save = async () => {
    const focus = focusText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Tandai field bermasalah dengan border merah (bukan toast) — sama seperti
    // halaman organisasi, supaya jelas bagian mana yang perlu diperbaiki.
    const errs = new Set<string>();
    const emailBad = (v: string) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim());
    if (!form.name.trim()) errs.add("name");
    if (emailBad(form.email)) errs.add("email");
    if (!form.description.trim()) errs.add("description");
    if (focus.length === 0) errs.add("focus");
    if (validatePhone(form.phone)) errs.add("phone");
    // Website & Instagram wajib — jadi bahan penilaian organisasi.
    if (!(form.website ?? "").trim() || validateWebsite(form.website ?? "")) errs.add("website");
    if (!(form.instagram ?? "").trim() || validateInstagram(form.instagram ?? "")) errs.add("instagram");
    if (!form.pic.name.trim()) errs.add("pic.name");
    if (validatePhone(form.pic.phone)) errs.add("pic.phone");
    if (!form.pic.position.trim()) errs.add("pic.position");
    if (emailBad(form.pic.email)) errs.add("pic.email");
    if (!(form.comproUrl ?? "").trim()) errs.add("comproUrl");
    if (form.legalDocs.length === 0) errs.add("legalDocs");
    if (errs.size) {
      setErrors(errs);
      return;
    }
    setErrors(new Set());

    try {
      await updateFunderProfile({
        ...form,
        focus,
        // Simpan tautan dalam bentuk utuh agar selalu bisa diklik di profil.
        website: normalizeWebsite(form.website ?? "") || undefined,
        instagram: normalizeInstagram(form.instagram ?? "") || undefined,
        twitter: undefined,
        facebook: undefined,
      });
      navigate("/funder/profil");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not save the profile."));
    }
  };

  return (
    <>
      <Topbar title="Sponsor partner account settings" />
      <div className="sh-shell__content">
        <PageHead
          title="Edit sponsor partner profile"
          subtitle="Complete the sponsor partner profile and the person in charge (PIC)."
        />

        <div style={{ display: "grid", gap: 20, maxWidth: 880 }}>
          {/* ============ Profil mitra sponsor ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Sponsor partner profile</h3>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <PhotoPicker
                label="Sponsor partner logo"
                value={form.logoUrl}
                fallback={initials(form.name)}
                onChange={(v) => set({ logoUrl: v })}
                size={96}
                hint="PNG/JPG, max 2 MB. If empty, the name initials are used."
              />

              <div className="sh-form-grid">
                <Field label="Sponsor partner name" required invalid={errors.has("name")}>
                  <input
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Misal: Sinergi Nusantara"
                  />
                </Field>
                <div className="sh-field">
                  <label className="sh-field__label">
                    Tipe mitra sponsor <Req />
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => set({ type: e.target.value as FunderType })}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Sponsor partner email"
                  required
                  icon={<Mail size={14} />}
                  invalid={errors.has("email")}
                  error={form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) ? "That email format is not valid." : null}
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="csr@mitra.co.id"
                  />
                </Field>
                <Field label="Fokus pendanaan" required hint="Separate with commas" invalid={errors.has("focus")}>
                  <input
                    value={focusText}
                    onChange={(e) => setFocusText(e.target.value)}
                    placeholder="Teknologi, Edukasi, Olahraga"
                  />
                </Field>
                <Field
                  label="Office address"
                  icon={<MapPin size={14} />}
                  hint="The address shown on your public profile."
                >
                  <input
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="Misal: Jl. Sudirman No. 1, Jakarta Selatan"
                  />
                </Field>
                <Field
                  label="Phone / WhatsApp"
                  required
                  icon={<Phone size={14} />}
                  hint="An active WhatsApp number — becomes the chat link on your profile."
                  invalid={errors.has("phone")}
                  error={validatePhone(form.phone)}
                >
                  <input
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                    placeholder="0812-3456-7890"
                  />
                </Field>
                <div className={`sh-field sh-field--wide${errors.has("description") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">
                    Deskripsi mitra sponsor <Req />
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Describe your profile, CSR mission, and the kinds of activities you support."
                  />
                </div>
              </div>
            </div>

            <div className="sh-form-section">
              <h4 style={{ marginBottom: 14 }}>Website & sosial media</h4>
              <div className="sh-form-grid">
                <Field
                  label="Website"
                  required
                  icon={<Globe size={14} />}
                  hint="Boleh tanpa https:// — dilengkapi otomatis."
                  invalid={errors.has("website")}
                  error={validateWebsite(form.website ?? "")}
                >
                  <input
                    value={form.website ?? ""}
                    onChange={(e) => set({ website: e.target.value })}
                    placeholder="mitra.co.id"
                  />
                </Field>
                <Field
                  label="Instagram"
                  required
                  icon={<Instagram size={14} />}
                  hint="Enter a username or a link — stored as a link."
                  invalid={errors.has("instagram")}
                  error={validateInstagram(form.instagram ?? "")}
                >
                  <input
                    value={form.instagram ?? ""}
                    onChange={(e) => set({ instagram: e.target.value })}
                    placeholder="@mitrasponsor"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ============ Dokumen mitra sponsor ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Sponsor partner documents</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                PDF · menjadi dasar penilaian kredibilitas
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
                label="Legal documents"
                required
                multiple
                docs={form.legalDocs}
                onChange={(docs) => set({ legalDocs: docs })}
                onPreview={(d, i) => openPreview("legal", d.name, i)}
                invalid={errors.has("legalDocs")}
                hint="Mis. akta pendirian, NIB, NPWP perusahaan."
              />
            </div>
          </section>

          {/* ============ PIC mitra sponsor ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Penanggung jawab (PIC)</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Main contact for coordination
              </span>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <div className="sh-form-grid">
                <Field label="PIC name" required invalid={errors.has("pic.name")}>
                  <input
                    value={form.pic.name}
                    onChange={(e) => setPic({ name: e.target.value })}
                    placeholder="Full name of the person in charge"
                  />
                </Field>
                <Field
                  label="PIC WhatsApp number"
                  required
                  invalid={errors.has("pic.phone")}
                  error={validatePhone(form.pic.phone)}
                >
                  <input
                    value={form.pic.phone}
                    onChange={(e) => setPic({ phone: e.target.value })}
                    placeholder="0812-3456-7890"
                  />
                </Field>
                <Field label="Role" required invalid={errors.has("pic.position")}>
                  <input
                    value={form.pic.position}
                    onChange={(e) => setPic({ position: e.target.value })}
                    placeholder="Misal: Manajer CSR"
                  />
                </Field>
                <Field
                  label="PIC email"
                  required
                  icon={<Mail size={14} />}
                  invalid={errors.has("pic.email")}
                  error={form.pic.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.pic.email.trim()) ? "That email format is not valid." : null}
                >
                  <input
                    type="email"
                    value={form.pic.email}
                    onChange={(e) => setPic({ email: e.target.value })}
                    placeholder="nama@mitra.co.id"
                  />
                </Field>
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
        <Modal open onClose={() => setPreview(null)} title={preview.title} width={760}>
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
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  /** Ditandai merah setelah tombol Simpan menemukan isian bermasalah. */
  invalid?: boolean;
  /** Pesan spesifik; hanya ditampilkan saat field ditandai merah. */
  error?: string | null;
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
          {error ?? "Must be filled in correctly."}
        </span>
      ) : (
        hint && <span className="sh-field__hint">{hint}</span>
      )}
    </div>
  );
}
