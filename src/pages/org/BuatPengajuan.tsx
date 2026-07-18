import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatEventDate, formatRupiah, makePengajuanId, nowIso } from "@/lib/format";
import { SUBMISSION_FEE } from "@/lib/pengajuan";
import type { Pengajuan, SponsorshipPackage } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  Check,
  UploadCloud,
  FileText,
  X,
  Package as PackageIcon,
} from "lucide-react";

const STEPS = ["Informasi umum", "Paket sponsorship", "Dokumen", "Review"] as const;

const emptyPackage = (): SponsorshipPackage => ({
  name: "",
  amount: 0,
  requests: [""],
  benefits: [""],
});

export default function BuatPengajuan() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { state, currentUser } = useStore();
  const { savePengajuan, submitPengajuan } = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const orgId = currentUser?.orgId ?? "";
  const editing = useMemo(
    () => (id ? state.pengajuan.find((p) => p.id === id) : undefined),
    [state.pengajuan, id],
  );

  const preselectedFunder = params.get("funder") ?? editing?.funderId ?? "";

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Pengajuan>(() => {
    if (editing)
      return {
        ...editing,
        packages: editing.packages.length ? editing.packages : [emptyPackage()],
      };
    return {
      id: makePengajuanId(state.pengajuan.length + 1),
      orgId,
      funderId: preselectedFunder,
      eventName: "",
      eventLocation: "",
      eventDate: "",
      description: "",
      eventBudget: 0,
      packages: [emptyPackage()],
      proposalDocUrl: "",
      extraNote: "",
      status: "draf",
      history: [
        {
          action: "Pengajuan dibuat",
          actor: "Organisasi",
          note: "Draf pengajuan dimulai.",
          at: nowIso(),
        },
      ],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  });

  const funder = state.funders.find((f) => f.id === form.funderId);
  const org = state.organizations.find((o) => o.id === orgId);
  const balance = org?.balance ?? 0;
  const isFirstSubmit = form.status === "draf";
  const feeDue = isFirstSubmit ? SUBMISSION_FEE : 0;
  const balanceOk = balance >= feeDue;
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!funder) {
    return (
      <>
        <Topbar title="Buat pengajuan" />
        <div className="sh-shell__content">
          <Empty
            title="Pendana belum dipilih"
            description="Pilih pendana dulu dari halaman Cari pendana."
            action={
              <Link to="/org/cari" className="sh-btn sh-btn--primary">
                Ke Cari pendana
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const set = (patch: Partial<Pengajuan>) => setForm((f) => ({ ...f, ...patch }));

  // ---- Package helpers ----
  const packages = form.packages;
  const setPackage = (i: number, patch: Partial<SponsorshipPackage>) =>
    set({ packages: packages.map((pk, idx) => (idx === i ? { ...pk, ...patch } : pk)) });
  const addPackage = () => set({ packages: [...packages, emptyPackage()] });
  const removePackage = (i: number) =>
    set({ packages: packages.filter((_, idx) => idx !== i) });

  type PointField = "requests" | "benefits";
  const setPoint = (pi: number, field: PointField, li: number, value: string) =>
    setPackage(pi, {
      [field]: packages[pi][field].map((v, idx) => (idx === li ? value : v)),
    });
  const addPoint = (pi: number, field: PointField) =>
    setPackage(pi, { [field]: [...packages[pi][field], ""] });
  const removePoint = (pi: number, field: PointField, li: number) =>
    setPackage(pi, { [field]: packages[pi][field].filter((_, idx) => idx !== li) });

  // ---- File upload (PDF only) ----
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.failed("Hanya berkas PDF yang diperbolehkan.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.failed("Ukuran PDF maksimal 4 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    // Simpan nama + isi (data URL) agar pendana bisa preview.
    const reader = new FileReader();
    reader.onload = () => {
      set({ proposalDocUrl: file.name, proposalDocData: String(reader.result) });
      toast.success(`Berkas "${file.name}" dipilih.`);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    set({ proposalDocUrl: "", proposalDocData: undefined });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Bersihkan paket: buang paket tanpa nama & poin kosong.
  const normalize = (f: Pengajuan): Pengajuan => ({
    ...f,
    packages: f.packages
      .filter((pk) => pk.name.trim() !== "")
      .map((pk) => ({
        ...pk,
        name: pk.name.trim(),
        amount: Number(pk.amount) || 0,
        requests: pk.requests.map((s) => s.trim()).filter(Boolean),
        benefits: pk.benefits.map((s) => s.trim()).filter(Boolean),
      })),
    updatedAt: nowIso(),
  });

  // ---- Validation per step ----
  const validPackages = packages.filter((pk) => pk.name.trim() !== "" && pk.amount > 0);
  const stepValid = (s: number): boolean => {
    if (s === 0) {
      return (
        form.eventName.trim() !== "" &&
        form.eventLocation.trim() !== "" &&
        form.description.trim() !== "" &&
        form.eventBudget > 0
      );
    }
    if (s === 1) {
      // Minimal 1 paket dengan nama + nominal.
      return validPackages.length > 0;
    }
    if (s === 2) {
      // Berkas proposal (PDF) wajib diunggah.
      return (form.proposalDocUrl ?? "").trim() !== "";
    }
    return true;
  };

  const persistDraft = async () => {
    try {
      await savePengajuan(normalize({ ...form, status: form.status === "draf" ? "draf" : form.status }));
      toast.success("Pengajuan disimpan sebagai draf.");
      navigate("/org/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal menyimpan."));
    }
  };

  const finalSubmit = async () => {
    if (!stepValid(0)) {
      toast.failed("Masih ada kolom wajib yang kosong.");
      setStep(0);
      return;
    }
    if (!stepValid(1)) {
      toast.failed("Isi minimal satu paket dengan nama & nominal.");
      setStep(1);
      return;
    }
    if (!stepValid(2)) {
      toast.failed("Unggah berkas proposal (PDF) dulu — wajib diisi.");
      setStep(2);
      return;
    }
    if (feeDue > 0 && !balanceOk) {
      toast.failed(
        `Saldo tidak cukup untuk biaya pengajuan ${formatRupiah(SUBMISSION_FEE)}. Silakan top-up dulu.`,
      );
      navigate("/org/topup");
      return;
    }
    try {
      await submitPengajuan(normalize(form));
      toast.success(`Pengajuan "${form.eventName}" dikirim ke ${funder.name}.`);
      navigate("/org/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal mengirim pengajuan."));
    }
  };

  const next = () => {
    if (!stepValid(step)) {
      toast.failed(
        step === 2
          ? "Unggah berkas proposal (PDF) dulu — wajib diisi."
          : step === 1
            ? "Isi minimal satu paket dengan nama & nominal."
            : "Lengkapi kolom wajib di langkah ini dulu.",
      );
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <>
      <Topbar title={editing ? "Lanjutkan pengajuan" : "Buat pengajuan"} />
      <div className="sh-shell__content">
        <PageHead
          title={editing ? "Lanjutkan pengajuan" : "Buat pengajuan"}
          subtitle={`Pengajuan ditujukan ke ${funder.name} (${funder.type}).`}
          actions={
            <Link to="/org/cari" className="sh-btn sh-btn--secondary">
              <ArrowLeft size={16} />
              Kembali
            </Link>
          }
        />

        {/* Stepper */}
        <div
          className="sh-row"
          style={{ gap: 8, marginBottom: 24, flexWrap: "wrap" }}
        >
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="sh-row" style={{ gap: 8 }}>
                <button
                  className="sh-row"
                  style={{ gap: 8, cursor: i <= step ? "pointer" : "default" }}
                  onClick={() => i <= step && setStep(i)}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      background: active || done ? "var(--role-accent)" : "var(--canvas-tint)",
                      color: active || done ? "var(--role-on-accent)" : "var(--ink-500)",
                    }}
                  >
                    {done ? <Check size={14} /> : i + 1}
                  </span>
                  <span
                    style={{
                      fontWeight: active ? 700 : 500,
                      color: active ? "var(--ink-900)" : "var(--ink-500)",
                      fontSize: 14,
                    }}
                  >
                    {label}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span style={{ color: "var(--line-strong)" }}>—</span>
                )}
              </div>
            );
          })}
        </div>

        <section className="sh-card">
          {/* STEP 0 — Informasi umum */}
          {step === 0 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">1. Informasi umum event</h3>
              <div className="sh-form-grid">
                <div className="sh-field sh-field--wide">
                  <label className="sh-field__label">Nama event</label>
                  <input
                    value={form.eventName}
                    onChange={(e) => set({ eventName: e.target.value })}
                    placeholder="Misal: Konser Amal Akhir Tahun"
                  />
                </div>
                <div className="sh-field">
                  <label className="sh-field__label">Lokasi event</label>
                  <input
                    value={form.eventLocation}
                    onChange={(e) => set({ eventLocation: e.target.value })}
                    placeholder="Misal: Balai Sarbini, Jakarta"
                  />
                </div>
                <div className="sh-field">
                  <label className="sh-field__label">Tanggal event</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => set({ eventDate: e.target.value })}
                  />
                </div>
                <div className="sh-field sh-field--wide">
                  <label className="sh-field__label">Deskripsi lengkap event</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Ceritakan tujuan, cakupan, dan target audiens event."
                  />
                </div>
                <div className="sh-field">
                  <label className="sh-field__label">Total anggaran event (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.eventBudget || ""}
                    onChange={(e) => set({ eventBudget: Number(e.target.value) })}
                    placeholder="Misal: 300000000"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Paket sponsorship */}
          {step === 1 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">2. Paket sponsorship</h3>
              <p className="sh-muted" style={{ marginTop: -6, marginBottom: 18 }}>
                Susun paket yang bisa dipilih pendana. Tiap paket: nama, nominal, detail
                permintaan, dan benefit untuk pendana.
              </p>

              <div style={{ display: "grid", gap: 16 }}>
                {packages.map((pk, pi) => (
                  <div
                    key={pi}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-lg)",
                      padding: 18,
                      background: "var(--canvas-soft)",
                    }}
                  >
                    <div className="sh-row sh-row--between" style={{ marginBottom: 14 }}>
                      <div className="sh-row" style={{ gap: 8 }}>
                        <PackageIcon size={16} style={{ color: "var(--brand-500)" }} />
                        <strong>Paket {pi + 1}</strong>
                      </div>
                      <button
                        className="sh-btn sh-btn--ghost sh-btn--icon"
                        onClick={() => removePackage(pi)}
                        title="Hapus paket"
                        disabled={packages.length <= 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="sh-form-grid" style={{ marginBottom: 8 }}>
                      <div className="sh-field">
                        <label className="sh-field__label">Nama paket</label>
                        <input
                          value={pk.name}
                          onChange={(e) => setPackage(pi, { name: e.target.value })}
                          placeholder="Misal: Gold"
                        />
                      </div>
                      <div className="sh-field">
                        <label className="sh-field__label">Nominal (Rp)</label>
                        <input
                          type="number"
                          min={0}
                          value={pk.amount || ""}
                          onChange={(e) => setPackage(pi, { amount: Number(e.target.value) })}
                          placeholder="Misal: 5000000"
                        />
                      </div>
                    </div>

                    <PointEditor
                      label="Detail permintaan"
                      hint="Apa yang diminta organisasi dari pendana pada paket ini."
                      placeholder="Misal: Dana tunai Rp 5.000.000"
                      values={pk.requests}
                      onChange={(li, v) => setPoint(pi, "requests", li, v)}
                      onAdd={() => addPoint(pi, "requests")}
                      onRemove={(li) => removePoint(pi, "requests", li)}
                    />

                    <PointEditor
                      label="Benefit untuk pendana"
                      hint="Imbalan/keuntungan yang didapat pendana pada paket ini."
                      placeholder="Misal: Logo di poster kegiatan"
                      values={pk.benefits}
                      onChange={(li, v) => setPoint(pi, "benefits", li, v)}
                      onAdd={() => addPoint(pi, "benefits")}
                      onRemove={(li) => removePoint(pi, "benefits", li)}
                    />
                  </div>
                ))}
              </div>

              <button
                className="sh-btn sh-btn--secondary sh-btn--sm"
                onClick={addPackage}
                style={{ marginTop: 14 }}
              >
                <Plus size={14} />
                Tambah paket
              </button>
            </div>
          )}

          {/* STEP 2 — Dokumen */}
          {step === 2 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">
                3. Dokumen pendukung
                <span style={{ color: "var(--status-failed)", marginLeft: 4 }}>*</span>
              </h3>
              <div className="sh-field__label" style={{ marginBottom: 8 }}>
                Berkas proposal (PDF) — wajib
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                style={{ display: "none" }}
                onChange={onPickFile}
              />
              {form.proposalDocUrl ? (
                <div
                  className="sh-row sh-row--between"
                  style={{
                    marginBottom: 16,
                    padding: "14px 16px",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--canvas-soft)",
                  }}
                >
                  <div className="sh-row" style={{ gap: 10 }}>
                    <FileText size={20} style={{ color: "var(--status-failed)" }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{form.proposalDocUrl}</div>
                      <div className="sh-muted" style={{ fontSize: 12 }}>
                        Berkas PDF proposal
                      </div>
                    </div>
                  </div>
                  <button
                    className="sh-btn sh-btn--ghost sh-btn--icon"
                    onClick={clearFile}
                    title="Hapus berkas"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="sh-file-drop"
                  style={{ marginBottom: 16, width: "100%", cursor: "pointer" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={28} style={{ color: "var(--brand-500)" }} />
                  <span>Klik untuk unggah berkas proposal.</span>
                  <span className="sh-muted" style={{ fontSize: 12 }}>
                    Wajib diisi · hanya format PDF yang diperbolehkan.
                  </span>
                </button>
              )}
              <div className="sh-field">
                <label className="sh-field__label">Catatan tambahan (opsional)</label>
                <textarea
                  rows={3}
                  value={form.extraNote ?? ""}
                  onChange={(e) => set({ extraNote: e.target.value })}
                  placeholder="Informasi lain yang ingin disampaikan ke pendana."
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">4. Review pengajuan</h3>
              <div className="sh-stack">
                <ReviewRow label="Pendana tujuan" value={`${funder.name} · ${funder.type}`} />
                <ReviewRow label="Nama event" value={form.eventName || "—"} />
                <ReviewRow label="Lokasi" value={form.eventLocation || "—"} />
                <ReviewRow label="Tanggal" value={formatEventDate(form.eventDate)} />
                <ReviewRow label="Deskripsi" value={form.description || "—"} />
                <ReviewRow label="Total anggaran event" value={formatRupiah(form.eventBudget)} />
                <div>
                  <div className="sh-meta-label" style={{ marginBottom: 8 }}>
                    Paket sponsorship ({validPackages.length})
                  </div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {validPackages.map((pk, i) => (
                      <PackageCard key={i} pkg={pk} />
                    ))}
                  </div>
                </div>
                <ReviewRow label="Dokumen" value={form.proposalDocUrl || "—"} />
              </div>

              {feeDue > 0 &&
                (balanceOk ? (
                  <div className="sh-notice" style={{ marginTop: 16 }}>
                    Saldo Anda akan terpotong <strong>{formatRupiah(SUBMISSION_FEE)}</strong>{" "}
                    sebagai biaya pengajuan proposal. Saldo saat ini:{" "}
                    <strong>{formatRupiah(balance)}</strong>.
                  </div>
                ) : (
                  <div className="sh-notice sh-notice--failed" style={{ marginTop: 16 }}>
                    Saldo tidak cukup untuk biaya pengajuan{" "}
                    <strong>{formatRupiah(SUBMISSION_FEE)}</strong> (saldo Anda:{" "}
                    {formatRupiah(balance)}).{" "}
                    <Link to="/org/topup" style={{ fontWeight: 700 }}>
                      Top-up saldo dulu
                    </Link>
                    .
                  </div>
                ))}

              <div className="sh-notice sh-notice--info" style={{ marginTop: 12 }}>
                Setelah dikirim, pengajuan masuk ke pendana untuk ditinjau. Pendana memilih
                salah satu paket lalu menyetujui, atau menolak/meminta revisi.
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="sh-card__footer">
            <button className="sh-btn sh-btn--secondary" onClick={persistDraft}>
              <Save size={16} />
              Simpan draf
            </button>
            <div style={{ flex: 1 }} />
            {step > 0 && (
              <button className="sh-btn sh-btn--ghost" onClick={prev}>
                <ArrowLeft size={16} />
                Sebelumnya
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="sh-btn sh-btn--primary" onClick={next}>
                Berikutnya
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="sh-btn sh-btn--primary"
                onClick={finalSubmit}
                disabled={feeDue > 0 && !balanceOk}
                style={feeDue > 0 && !balanceOk ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
              >
                <Send size={16} />
                Kirim pengajuan
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function PointEditor({
  label,
  hint,
  placeholder,
  values,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="sh-field__label" style={{ marginBottom: 2 }}>
        {label}
      </div>
      {hint && (
        <div className="sh-muted" style={{ fontSize: 12, marginBottom: 8 }}>
          {hint}
        </div>
      )}
      <div style={{ display: "grid", gap: 8 }}>
        {values.map((v, i) => (
          <div key={i} className="sh-row" style={{ gap: 8 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: "var(--line-strong)",
                flex: "none",
              }}
            />
            <input
              className="sh-input"
              style={{ flex: 1 }}
              value={v}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={placeholder}
            />
            <button
              className="sh-btn sh-btn--ghost sh-btn--icon"
              onClick={() => onRemove(i)}
              title="Hapus poin"
              disabled={values.length <= 1}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onAdd} style={{ marginTop: 8 }}>
        <Plus size={14} />
        Tambah poin
      </button>
    </div>
  );
}

function PackageCard({ pkg }: { pkg: SponsorshipPackage }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
      }}
    >
      <div className="sh-row sh-row--between" style={{ marginBottom: 10 }}>
        <strong>{pkg.name}</strong>
        <strong className="num" style={{ color: "var(--brand-600)" }}>
          {formatRupiah(pkg.amount)}
        </strong>
      </div>
      {pkg.requests.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div className="sh-meta-label">Detail permintaan</div>
          <ul style={{ margin: "4px 0 0 18px" }}>
            {pkg.requests.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {pkg.benefits.length > 0 && (
        <div>
          <div className="sh-meta-label">Benefit untuk pendana</div>
          <ul style={{ margin: "4px 0 0 18px" }}>
            {pkg.benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="sh-meta-label">{label}</div>
      <div className="sh-meta-value" style={{ fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
