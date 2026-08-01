import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore, useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { GantiPassword } from "@/components/GantiPassword";
import { initials } from "@/lib/format";
import {
  normalizeInstagram,
  normalizeWebsite,
  validateInstagram,
  validatePhone,
  validateWebsite,
} from "@/lib/contactValidate";
import type { Funder, FunderType } from "@/lib/types";
import { Save, X, Instagram, Globe, ArrowLeft, ImagePlus, Mail, Phone } from "lucide-react";

const TYPES: FunderType[] = ["Korporasi", "Individu", "Filantropi", "Perbankan"];

export default function FunderPengaturan() {
  const { state, currentUser } = useStore();
  const { updateFunderProfile } = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const funder = state.funders.find((f) => f.id === currentUser?.funderId);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Funder | null>(funder ?? null);
  const [focusText, setFocusText] = useState((funder?.focus ?? []).join(", "));
  const [errors, setErrors] = useState<Set<string>>(new Set());

  if (!funder || !form) return null;

  const set = (patch: Partial<Funder>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setPic = (patch: Partial<Funder["pic"]>) =>
    setForm((f) => (f ? { ...f, pic: { ...f.pic, ...patch } } : f));

  const onPickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.failed("Logo harus berupa gambar (PNG/JPG).");
      if (logoRef.current) logoRef.current.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.failed("Ukuran logo maksimal 2 MB.");
      if (logoRef.current) logoRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set({ logoUrl: String(reader.result) });
      toast.success("Logo dipilih.");
    };
    reader.readAsDataURL(file);
  };

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
    if (validateWebsite(form.website ?? "")) errs.add("website");
    if (validateInstagram(form.instagram ?? "")) errs.add("instagram");
    if (!form.pic.name.trim()) errs.add("pic.name");
    if (validatePhone(form.pic.phone)) errs.add("pic.phone");
    if (!form.pic.position.trim()) errs.add("pic.position");
    if (emailBad(form.pic.email)) errs.add("pic.email");
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
      toast.success("Profil mitra sponsor tersimpan.");
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
          actions={
            <div className="sh-row" style={{ gap: 8 }}>
              <button
                className="sh-btn sh-btn--secondary"
                onClick={() => navigate("/funder/profil")}
              >
                <ArrowLeft size={16} />
                Kembali
              </button>
              <button className="sh-btn sh-btn--primary" onClick={save}>
                <Save size={16} />
                Simpan profil
              </button>
            </div>
          }
        />

        <div style={{ display: "grid", gap: 20, maxWidth: 880 }}>
          {/* ============ Profil mitra sponsor ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Profil mitra sponsor</h3>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              {/* Logo */}
              <div style={{ marginBottom: 18 }}>
                <label className="sh-field__label" style={{ display: "block", marginBottom: 8 }}>
                  Logo mitra sponsor
                </label>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onPickLogo}
                />
                <div className="sh-row" style={{ gap: 14, alignItems: "center" }}>
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo"
                      className="sh-org-logo"
                      style={{ width: 64, height: 64, objectFit: "cover", padding: 0 }}
                    />
                  ) : (
                    <span className="sh-org-logo" style={{ width: 64, height: 64, fontSize: 22 }}>
                      {initials(form.name)}
                    </span>
                  )}
                  <div className="sh-row" style={{ gap: 8 }}>
                    <button
                      type="button"
                      className="sh-btn sh-btn--secondary sh-btn--sm"
                      onClick={() => logoRef.current?.click()}
                    >
                      <ImagePlus size={14} />
                      {form.logoUrl ? "Ganti logo" : "Unggah logo"}
                    </button>
                    {form.logoUrl && (
                      <button
                        type="button"
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        onClick={() => {
                          set({ logoUrl: undefined });
                          if (logoRef.current) logoRef.current.value = "";
                        }}
                      >
                        <X size={14} />
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
                <span className="sh-field__hint">
                  PNG/JPG, maks 2 MB. Jika kosong, dipakai inisial nama.
                </span>
              </div>

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
