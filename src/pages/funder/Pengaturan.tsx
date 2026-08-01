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
      toast.failed(String(e?.message || "Gagal menyimpan profil."));
    }
  };

  return (
    <>
      <Topbar title="Pengaturan akun mitra sponsor" />
      <div className="sh-shell__content">
        <PageHead
          title="Edit profil mitra sponsor"
          subtitle="Lengkapi profil mitra sponsor dan penanggung jawab (PIC)."
        />

        <div style={{ display: "grid", gap: 20, maxWidth: 880 }}>
          {/* ============ Profil mitra sponsor ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Profil mitra sponsor</h3>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <PhotoPicker
                label="Logo mitra sponsor"
                value={form.logoUrl}
                fallback={initials(form.name)}
                onChange={(v) => set({ logoUrl: v })}
                size={96}
                hint="PNG/JPG, maks 2 MB. Jika kosong, dipakai inisial nama."
              />

              <div className="sh-form-grid">
                <Field label="Nama mitra sponsor" required invalid={errors.has("name")}>
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
                  label="Email mitra sponsor"
                  required
                  icon={<Mail size={14} />}
                  invalid={errors.has("email")}
                  error={form.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) ? "Format email tidak valid." : null}
                >
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="csr@mitra.co.id"
                  />
                </Field>
                <Field label="Fokus pendanaan" required hint="Pisahkan dengan koma" invalid={errors.has("focus")}>
                  <input
                    value={focusText}
                    onChange={(e) => setFocusText(e.target.value)}
                    placeholder="Teknologi, Edukasi, Olahraga"
                  />
                </Field>
                <Field
                  label="Alamat kantor"
                  icon={<MapPin size={14} />}
                  hint="Alamat yang tampil di profil publik."
                >
                  <input
                    value={form.address}
                    onChange={(e) => set({ address: e.target.value })}
                    placeholder="Misal: Jl. Sudirman No. 1, Jakarta Selatan"
                  />
                </Field>
                <Field
                  label="No. Telepon / WhatsApp"
                  required
                  icon={<Phone size={14} />}
                  hint="Nomor aktif WhatsApp — jadi tautan chat di profil."
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
                    placeholder="Ceritakan profil, misi CSR, dan jenis kegiatan yang didukung."
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
                  hint="Isi username atau tautan — disimpan sebagai tautan."
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
              <h3>Dokumen mitra sponsor</h3>
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
                label="Dokumen legal"
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
                Kontak utama untuk koordinasi
              </span>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <div className="sh-form-grid">
                <Field label="Nama PIC" required invalid={errors.has("pic.name")}>
                  <input
                    value={form.pic.name}
                    onChange={(e) => setPic({ name: e.target.value })}
                    placeholder="Nama lengkap penanggung jawab"
                  />
                </Field>
                <Field
                  label="Nomor WA PIC"
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
                <Field label="Jabatan" required invalid={errors.has("pic.position")}>
                  <input
                    value={form.pic.position}
                    onChange={(e) => setPic({ position: e.target.value })}
                    placeholder="Misal: Manajer CSR"
                  />
                </Field>
                <Field
                  label="Email PIC"
                  required
                  icon={<Mail size={14} />}
                  invalid={errors.has("pic.email")}
                  error={form.pic.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.pic.email.trim()) ? "Format email tidak valid." : null}
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
              Simpan profil
            </button>
          </div>

          <GantiPassword />
        </div>
      </div>

      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.title} width={760}>
          {preview.data === null ? (
            <p className="sh-muted">Memuat dokumen…</p>
          ) : preview.data ? (
            <PdfPreview dataUrl={preview.data} fileName={preview.title} />
          ) : (
            <p className="sh-muted">Dokumen tidak dapat dimuat.</p>
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
          {error ?? "Wajib diisi dengan benar."}
        </span>
      ) : (
        hint && <span className="sh-field__hint">{hint}</span>
      )}
    </div>
  );
}
