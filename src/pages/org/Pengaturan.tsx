import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { useStore, useActions } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { initials } from "@/lib/format";
import type { Organization } from "@/lib/types";
import {
  Save,
  UploadCloud,
  FileText,
  X,
  Instagram,
  Music2,
  Globe,
  ArrowLeft,
  ImagePlus,
  CreditCard,
  Mail,
} from "lucide-react";

export default function OrgPengaturan() {
  const { state, currentUser } = useStore();
  const { updateOrgProfile } = useActions();
  const toast = useToast();
  const navigate = useNavigate();
  const org = state.organizations.find((o) => o.id === currentUser?.orgId);
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Organization | null>(org ?? null);

  if (!org || !form) return null;

  const set = (patch: Partial<Organization>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));
  const setPic = (patch: Partial<Organization["pic"]>) =>
    setForm((f) => (f ? { ...f, pic: { ...f.pic, ...patch } } : f));

  const onPickId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.failed("KTP/KTM harus berformat PDF.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setPic({ idDocUrl: file.name });
    toast.success(`Berkas "${file.name}" dipilih.`);
  };

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
      toast.success("Logo organisasi dipilih.");
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const required: Array<[boolean, string]> = [
      [form.name.trim() !== "", "Nama organisasi"],
      [form.category.trim() !== "", "Kategori organisasi"],
      [form.email.trim() !== "", "Email organisasi"],
      [form.payoutAccount.trim() !== "", "Nomor rekening pencairan"],
      [form.description.trim() !== "", "Deskripsi organisasi"],
      [form.pic.name.trim() !== "", "Nama PIC"],
      [form.pic.phone.trim() !== "", "Nomor WA PIC"],
      [form.pic.position.trim() !== "", "Jabatan PIC"],
      [form.pic.email.trim() !== "", "Email PIC"],
      [form.pic.idDocUrl.trim() !== "", "Upload KTP/KTM (PDF)"],
    ];
    const missing = required.find(([ok]) => !ok);
    if (missing) {
      toast.failed(`${missing[1]} wajib diisi.`);
      return;
    }
    // Sinkronkan no.hp kontak ber-gate + inisial logo dari nama PIC & nama org.
    try {
      await updateOrgProfile({
        ...form,
        phone: form.pic.phone,
        logoInitials: initials(form.name),
      });
      toast.success("Profil organisasi tersimpan.");
      navigate("/org/profil");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal menyimpan profil."));
    }
  };

  return (
    <>
      <Topbar title="Pengaturan organisasi" />
      <div className="sh-shell__content">
        <PageHead
          title="Edit profil organisasi"
          subtitle="Lengkapi profil organisasi dan penanggung jawab (PIC)."
          actions={
            <div className="sh-row" style={{ gap: 8 }}>
              <button
                className="sh-btn sh-btn--secondary"
                onClick={() => navigate("/org/profil")}
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
          {/* ============ Profil organisasi ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Profil organisasi</h3>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              {/* Logo organisasi */}
              <div style={{ marginBottom: 18 }}>
                <label className="sh-field__label" style={{ display: "block", marginBottom: 8 }}>
                  Logo organisasi
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
                    <span
                      className="sh-org-logo"
                      style={{ width: 64, height: 64, fontSize: 22 }}
                    >
                      {form.logoInitials}
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
                <Field label="Nama organisasi" required>
                  <input
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Misal: Yayasan Seni Budaya"
                  />
                </Field>
                <Field label="Kategori organisasi" required hint="Bidang gerak organisasi">
                  <input
                    value={form.category}
                    onChange={(e) => set({ category: e.target.value })}
                    placeholder="Misal: Seni & Budaya / Edukasi / Olahraga"
                  />
                </Field>
                <Field label="Email organisasi" required>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                    placeholder="halo@organisasi.org"
                  />
                </Field>
                <Field label="Kota">
                  <input
                    value={form.city}
                    onChange={(e) => set({ city: e.target.value })}
                    placeholder="Misal: Jakarta"
                  />
                </Field>
                <Field
                  label="Nomor rekening pencairan"
                  required
                  icon={<CreditCard size={14} />}
                  hint="Rekening tujuan dana sponsorship (hanya admin & organisasi yang melihat)"
                >
                  <input
                    value={form.payoutAccount}
                    onChange={(e) => set({ payoutAccount: e.target.value })}
                    placeholder="Misal: BCA 0123456789 a.n. Yayasan"
                  />
                </Field>
                <div className="sh-field sh-field--wide">
                  <label className="sh-field__label">
                    Deskripsi organisasi <Req />
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Ceritakan misi, fokus, dan kegiatan utama organisasi."
                  />
                </div>
              </div>
            </div>

            <div className="sh-form-section">
              <h4 style={{ marginBottom: 14 }}>Website & sosial media</h4>
              <div className="sh-form-grid">
                <Field label="Website" icon={<Globe size={14} />} hint="Tempel link lengkap (https://…)">
                  <input
                    value={form.website ?? ""}
                    onChange={(e) => set({ website: e.target.value })}
                    placeholder="https://organisasi.org"
                  />
                </Field>
                <Field label="Instagram" icon={<Instagram size={14} />} hint="Tempel link, bukan username">
                  <input
                    value={form.instagram ?? ""}
                    onChange={(e) => set({ instagram: e.target.value })}
                    placeholder="https://instagram.com/organisasi"
                  />
                </Field>
                <Field label="TikTok" icon={<Music2 size={14} />} hint="Tempel link, bukan username">
                  <input
                    value={form.tiktok ?? ""}
                    onChange={(e) => set({ tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@organisasi"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* ============ PIC organisasi ============ */}
          <section className="sh-card">
            <header className="sh-card__header">
              <h3>Penanggung jawab (PIC)</h3>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Kontak utama untuk koordinasi
              </span>
            </header>
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <div className="sh-form-grid">
                <Field label="Nama PIC" required>
                  <input
                    value={form.pic.name}
                    onChange={(e) => setPic({ name: e.target.value })}
                    placeholder="Nama lengkap penanggung jawab"
                  />
                </Field>
                <Field label="Nomor WA PIC" required>
                  <input
                    value={form.pic.phone}
                    onChange={(e) => setPic({ phone: e.target.value })}
                    placeholder="0812-3456-7890"
                  />
                </Field>
                <Field label="Jabatan di organisasi" required>
                  <input
                    value={form.pic.position}
                    onChange={(e) => setPic({ position: e.target.value })}
                    placeholder="Misal: Direktur Program"
                  />
                </Field>
                <Field label="Email PIC" required icon={<Mail size={14} />}>
                  <input
                    type="email"
                    value={form.pic.email}
                    onChange={(e) => setPic({ email: e.target.value })}
                    placeholder="nama@organisasi.org"
                  />
                </Field>
              </div>

              {/* Upload KTP/KTM (wajib, PDF) */}
              <div style={{ marginTop: 18 }}>
                <label className="sh-field__label" style={{ display: "block", marginBottom: 8 }}>
                  Upload KTP/KTM (PDF) <Req />
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: "none" }}
                  onChange={onPickId}
                />
                {form.pic.idDocUrl ? (
                  <div
                    className="sh-row sh-row--between"
                    style={{
                      padding: "14px 16px",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--canvas-soft)",
                    }}
                  >
                    <div className="sh-row" style={{ gap: 10 }}>
                      <FileText size={20} style={{ color: "var(--status-failed)" }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{form.pic.idDocUrl}</div>
                        <div className="sh-muted" style={{ fontSize: 12 }}>
                          Dokumen identitas PIC (hanya admin & organisasi yang melihat)
                        </div>
                      </div>
                    </div>
                    <button
                      className="sh-btn sh-btn--ghost sh-btn--icon"
                      onClick={() => {
                        setPic({ idDocUrl: "" });
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      title="Hapus berkas"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sh-file-drop"
                    style={{ width: "100%", cursor: "pointer" }}
                    onClick={() => fileRef.current?.click()}
                  >
                    <UploadCloud size={28} style={{ color: "var(--brand-500)" }} />
                    <span>Klik untuk unggah KTP/KTM PIC.</span>
                    <span className="sh-muted" style={{ fontSize: 12 }}>
                      Wajib diisi · hanya format PDF yang diperbolehkan.
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="sh-row" style={{ justifyContent: "flex-end" }}>
            <button className="sh-btn sh-btn--primary" onClick={save}>
              <Save size={16} />
              Simpan profil
            </button>
          </div>
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
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="sh-field">
      <label className="sh-field__label sh-row" style={{ gap: 6 }}>
        {icon}
        {label} {required && <Req />}
      </label>
      {children}
      {hint && <span className="sh-field__hint">{hint}</span>}
    </div>
  );
}
