import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatEventDate, formatRupiah, makePengajuanId, nowIso } from "@/lib/format";
import { SUBMISSION_FEE, packageAmount, requestLabel } from "@/lib/pengajuan";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import type {
  Pengajuan,
  PengajuanDoc,
  SponsorshipPackage,
  SponsorshipRequest,
} from "@/lib/types";
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
  Eye,
  X,
  Package as PackageIcon,
} from "lucide-react";

const STEPS = ["Informasi umum", "Paket sponsorship", "Dokumen", "Review"] as const;

const emptyRequest = (): SponsorshipRequest => ({ type: "in_cash", amount: 0, spec: "" });

const emptyPackage = (): SponsorshipPackage => ({
  name: "",
  requests: [emptyRequest()],
  benefits: [""],
});

/** Poin detail permintaan dianggap terisi bila in_cash>0 atau in_kind ada spesifikasi. */
const requestFilled = (r: SponsorshipRequest): boolean =>
  r.type === "in_cash" ? Number(r.amount) > 0 : r.spec.trim() !== "";

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
  const [previewDoc, setPreviewDoc] = useState<PengajuanDoc | null>(null);
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
      documents: [],
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
  const notVerified = !!org && org.verificationStatus !== "terverifikasi";
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

  // Detail permintaan (poin bertipe in_cash / in_kind)
  const setRequest = (pi: number, li: number, patch: Partial<SponsorshipRequest>) =>
    setPackage(pi, {
      requests: packages[pi].requests.map((r, idx) => (idx === li ? { ...r, ...patch } : r)),
    });
  const addRequest = (pi: number) =>
    setPackage(pi, { requests: [...packages[pi].requests, emptyRequest()] });
  const removeRequest = (pi: number, li: number) =>
    setPackage(pi, { requests: packages[pi].requests.filter((_, idx) => idx !== li) });

  // Benefit untuk pendana (poin teks bebas)
  const setBenefit = (pi: number, li: number, value: string) =>
    setPackage(pi, { benefits: packages[pi].benefits.map((v, idx) => (idx === li ? value : v)) });
  const addBenefit = (pi: number) =>
    setPackage(pi, { benefits: [...packages[pi].benefits, ""] });
  const removeBenefit = (pi: number, li: number) =>
    setPackage(pi, { benefits: packages[pi].benefits.filter((_, idx) => idx !== li) });

  // ---- File upload (PDF, bisa lebih dari satu) ----
  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = ""; // izinkan pilih berkas sama lagi
    if (!files.length) return;
    const added: PengajuanDoc[] = [];
    for (const file of files) {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        toast.failed(`"${file.name}" bukan PDF — dilewati.`);
        continue;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast.failed(`"${file.name}" melebihi 4 MB — dilewati.`);
        continue;
      }
      if ((form.documents ?? []).some((d) => d.name === file.name)) {
        toast.failed(`"${file.name}" sudah ditambahkan.`);
        continue;
      }
      added.push({ name: file.name, data: await readFileAsDataUrl(file) });
    }
    if (added.length) {
      set({ documents: [...(form.documents ?? []), ...added] });
      toast.success(
        added.length === 1
          ? `Berkas "${added[0].name}" ditambahkan.`
          : `${added.length} berkas ditambahkan.`,
      );
    }
  };

  const removeDoc = (index: number) =>
    set({ documents: (form.documents ?? []).filter((_, i) => i !== index) });

  // Bersihkan paket: buang paket tanpa nama & poin kosong; rapikan tiap poin per tipe.
  const normalize = (f: Pengajuan): Pengajuan => ({
    ...f,
    packages: f.packages
      .filter((pk) => pk.name.trim() !== "")
      .map((pk) => ({
        name: pk.name.trim(),
        requests: pk.requests
          .filter(requestFilled)
          .map((r) =>
            r.type === "in_cash"
              ? { type: "in_cash" as const, amount: Number(r.amount) || 0, spec: "" }
              : { type: "in_kind" as const, amount: 0, spec: r.spec.trim() },
          ),
        benefits: pk.benefits.map((s) => s.trim()).filter(Boolean),
      })),
    updatedAt: nowIso(),
  });

  // ---- Validation per step ----
  // Paket valid: punya nama & minimal satu poin detail permintaan terisi.
  const validPackages = packages.filter(
    (pk) => pk.name.trim() !== "" && pk.requests.some(requestFilled),
  );
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
      // Minimal satu berkas pendukung (PDF) wajib diunggah.
      return (form.documents ?? []).length > 0;
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
    if (org && org.verificationStatus !== "terverifikasi") {
      toast.failed("Organisasi belum terverifikasi admin. Ajukan verifikasi dulu di Dashboard.");
      navigate("/org/dashboard");
      return;
    }
    if (!stepValid(0)) {
      toast.failed("Masih ada kolom wajib yang kosong.");
      setStep(0);
      return;
    }
    if (!stepValid(1)) {
      toast.failed("Isi minimal satu paket dengan nama & satu detail permintaan.");
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
            ? "Isi minimal satu paket dengan nama & satu detail permintaan."
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
                  <CurrencyInput
                    value={form.eventBudget}
                    onChange={(n) => set({ eventBudget: n })}
                    placeholder="Misal: 300.000.000"
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
                Susun paket yang bisa dipilih pendana. Tiap paket: nama, detail permintaan
                (in-cash / in-kind), dan benefit untuk pendana.
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

                    <div className="sh-field" style={{ marginBottom: 8, maxWidth: 320 }}>
                      <label className="sh-field__label">Nama paket</label>
                      <input
                        value={pk.name}
                        onChange={(e) => setPackage(pi, { name: e.target.value })}
                        placeholder="Misal: Gold"
                      />
                    </div>

                    <RequestEditor
                      requests={pk.requests}
                      total={packageAmount(pk)}
                      onChangeType={(li, t) =>
                        setRequest(pi, li, { type: t, amount: 0, spec: "" })
                      }
                      onChangeAmount={(li, n) => setRequest(pi, li, { amount: n })}
                      onChangeSpec={(li, v) => setRequest(pi, li, { spec: v })}
                      onAdd={() => addRequest(pi)}
                      onRemove={(li) => removeRequest(pi, li)}
                    />

                    <PointEditor
                      label="Benefit untuk pendana"
                      hint="Imbalan/keuntungan yang didapat pendana pada paket ini."
                      placeholder="Misal: Logo di poster kegiatan"
                      values={pk.benefits}
                      onChange={(li, v) => setBenefit(pi, li, v)}
                      onAdd={() => addBenefit(pi)}
                      onRemove={(li) => removeBenefit(pi, li)}
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
                Berkas pendukung (PDF) — wajib, bisa lebih dari satu
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                multiple
                style={{ display: "none" }}
                onChange={onPickFile}
              />
              {(form.documents ?? []).length > 0 && (
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  {form.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="sh-row sh-row--between"
                      style={{
                        padding: "12px 14px",
                        border: "1px solid var(--line)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--canvas-soft)",
                      }}
                    >
                      <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
                        <FileText size={20} style={{ color: "var(--status-failed)", flex: "none" }} />
                        <div style={{ fontWeight: 600, wordBreak: "break-all" }}>{doc.name}</div>
                      </div>
                      <div className="sh-row" style={{ gap: 4, flex: "none" }}>
                        <button
                          className="sh-btn sh-btn--ghost sh-btn--icon"
                          onClick={() => setPreviewDoc(doc)}
                          title="Pratinjau"
                          disabled={!doc.data}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="sh-btn sh-btn--ghost sh-btn--icon"
                          onClick={() => removeDoc(i)}
                          title="Hapus berkas"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="sh-file-drop"
                style={{ marginBottom: 16, width: "100%", cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={28} style={{ color: "var(--brand-500)" }} />
                <span>
                  {(form.documents ?? []).length > 0
                    ? "Tambah berkas lain."
                    : "Klik untuk unggah berkas pendukung."}
                </span>
                <span className="sh-muted" style={{ fontSize: 12 }}>
                  Bisa pilih beberapa sekaligus · hanya PDF · maks 4 MB per berkas.
                </span>
              </button>
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
                <div>
                  <div className="sh-meta-label" style={{ marginBottom: 8 }}>
                    Dokumen pendukung ({(form.documents ?? []).length})
                  </div>
                  {(form.documents ?? []).length === 0 ? (
                    <div className="sh-meta-value" style={{ fontWeight: 600 }}>—</div>
                  ) : (
                    <div style={{ display: "grid", gap: 8 }}>
                      {form.documents.map((doc, i) => (
                        <div
                          key={i}
                          className="sh-row sh-row--between"
                          style={{
                            padding: "10px 14px",
                            border: "1px solid var(--line)",
                            borderRadius: "var(--radius-md)",
                          }}
                        >
                          <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
                            <FileText size={18} style={{ color: "var(--status-failed)", flex: "none" }} />
                            <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{doc.name}</span>
                          </div>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => setPreviewDoc(doc)}
                            disabled={!doc.data}
                            style={{ flex: "none" }}
                          >
                            <Eye size={14} />
                            Pratinjau
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {feeDue > 0 &&
                (balanceOk ? (
                  <div className="sh-notice" style={{ marginTop: 16 }}>
                    Saldo Anda akan terpotong <strong>{formatRupiah(SUBMISSION_FEE)}</strong>{" "}
                    sebagai biaya pengajuan. Jika <strong>disetujui</strong>, biaya tidak
                    dikembalikan (biaya admin); jika <strong>ditolak</strong>,{" "}
                    {formatRupiah(40000)} dikembalikan (biaya admin {formatRupiah(10000)}). Saldo
                    saat ini: <strong>{formatRupiah(balance)}</strong>.
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

              {notVerified && (
                <div className="sh-notice sh-notice--failed" style={{ marginTop: 12 }}>
                  Organisasi Anda belum terverifikasi admin, jadi pengajuan belum bisa dikirim. Draf
                  tetap bisa disimpan.{" "}
                  <Link to="/org/dashboard" style={{ fontWeight: 700 }}>
                    Ajukan verifikasi di Dashboard
                  </Link>
                  .
                </div>
              )}

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
                disabled={(feeDue > 0 && !balanceOk) || notVerified}
                style={
                  (feeDue > 0 && !balanceOk) || notVerified
                    ? { opacity: 0.55, cursor: "not-allowed" }
                    : undefined
                }
              >
                <Send size={16} />
                Kirim pengajuan
              </button>
            )}
          </div>
        </section>
      </div>

      {previewDoc && (
        <Modal
          open
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.name || "Pratinjau dokumen"}
          width={760}
        >
          {previewDoc.data ? (
            <PdfPreview dataUrl={previewDoc.data} fileName={previewDoc.name} />
          ) : (
            <p className="sh-muted">Dokumen tidak dapat dimuat.</p>
          )}
        </Modal>
      )}
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

/** Editor "Detail permintaan": tiap poin punya dropdown tipe (In-Cash / In-Kind).
 *  In-Cash → nominal rupiah berformat; In-Kind → spesifikasi barang. */
function RequestEditor({
  requests,
  total,
  onChangeType,
  onChangeAmount,
  onChangeSpec,
  onAdd,
  onRemove,
}: {
  requests: SponsorshipRequest[];
  total: number;
  onChangeType: (i: number, t: SponsorshipRequest["type"]) => void;
  onChangeAmount: (i: number, n: number) => void;
  onChangeSpec: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="sh-row sh-row--between" style={{ marginBottom: 2 }}>
        <div className="sh-field__label">Detail permintaan</div>
        {total > 0 && (
          <div className="sh-muted" style={{ fontSize: 12 }}>
            Total dana:{" "}
            <strong className="num" style={{ color: "var(--brand-600)" }}>
              {formatRupiah(total)}
            </strong>
          </div>
        )}
      </div>
      <div className="sh-muted" style={{ fontSize: 12, marginBottom: 8 }}>
        Apa yang diminta organisasi dari pendana. Pilih jenis tiap poin: In-Cash (dana) atau
        In-Kind (barang/jasa).
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {requests.map((r, i) => (
          <div key={i} className="sh-row" style={{ gap: 8, alignItems: "flex-start" }}>
            <select
              className="sh-input"
              style={{ flex: "none", width: 116 }}
              value={r.type}
              onChange={(e) => onChangeType(i, e.target.value as SponsorshipRequest["type"])}
            >
              <option value="in_cash">In-Cash</option>
              <option value="in_kind">In-Kind</option>
            </select>
            {r.type === "in_cash" ? (
              <CurrencyInput
                value={r.amount}
                onChange={(n) => onChangeAmount(i, n)}
                placeholder="Nominal, mis: 5.000.000"
                style={{ flex: 1 }}
              />
            ) : (
              <input
                className="sh-input"
                style={{ flex: 1 }}
                value={r.spec}
                onChange={(e) => onChangeSpec(i, e.target.value)}
                placeholder="Spesifikasi barang, mis: 100 kaos katun ukuran M"
              />
            )}
            <button
              className="sh-btn sh-btn--ghost sh-btn--icon"
              onClick={() => onRemove(i)}
              title="Hapus poin"
              disabled={requests.length <= 1}
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
          {formatRupiah(packageAmount(pkg))}
        </strong>
      </div>
      {pkg.requests.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div className="sh-meta-label">Detail permintaan</div>
          <ul style={{ margin: "4px 0 0 18px" }}>
            {pkg.requests.map((r, i) => (
              <li key={i}>{requestLabel(r)}</li>
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
