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
  AlertCircle,
  Lock,
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
  const [errors, setErrors] = useState<Set<string>>(new Set());
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

  // Tanggal hari ini dalam zona waktu lokal (bukan UTC) agar batas "tidak
  // boleh mundur" sesuai kalender pengguna.
  const todayIso = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }, []);

  // Mode revisi: mitra sponsor sudah menilai, yang boleh diubah hanya paket.
  const isRevision = form.status === "perlu_revisi";
  // Saat revisi, hanya paket sponsorship yang boleh diubah.
  const locked = isRevision;

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
            title="Mitra Sponsor belum dipilih"
            description="Pilih mitra sponsor dulu dari halaman Cari mitra sponsor."
            action={
              <Link to="/org/cari" className="sh-btn sh-btn--primary">
                Ke Cari mitra sponsor
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

  // Benefit untuk mitra sponsor (poin teks bebas)
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

  /* Bersihkan paket sebelum disimpan.
     - `lenient` (dipakai saat menyimpan draf): paket dipertahankan selama ada
       isinya (nama ATAU permintaan ATAU benefit), supaya pekerjaan setengah
       jadi tidak hilang diam-diam.
     - ketat (saat mengirim): hanya paket bernama yang disimpan. */
  const normalize = (f: Pengajuan, lenient = false): Pengajuan => ({
    ...f,
    packages: f.packages
      .filter((pk) =>
        lenient
          ? pk.name.trim() !== "" ||
            pk.requests.some(requestFilled) ||
            pk.benefits.some((b) => b.trim() !== "")
          : pk.name.trim() !== "",
      )
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

  // ---- Validasi per langkah ----
  // Kunci error memakai penamaan field agar bisa dipetakan ke input di layar.
  // Paket dianggap lengkap bila: bernama, ada minimal satu detail permintaan
  // terisi, DAN minimal satu benefit untuk mitra sponsor.
  const packageComplete = (pk: SponsorshipPackage) =>
    pk.name.trim() !== "" &&
    pk.requests.some(requestFilled) &&
    pk.benefits.some((b) => b.trim() !== "");

  const validPackages = packages.filter(packageComplete);

  const collectErrors = (s: number): Set<string> => {
    const e = new Set<string>();
    if (s === 0) {
      if (!form.eventName.trim()) e.add("eventName");
      if (!form.eventLocation.trim()) e.add("eventLocation");
      if (!form.description.trim()) e.add("description");
      if (!(form.eventBudget > 0)) e.add("eventBudget");
      // Tanggal event opsional, tetapi bila diisi tidak boleh mundur.
      if (form.eventDate && form.eventDate < todayIso) e.add("eventDate");
    }
    if (s === 1) {
      packages.forEach((pk, i) => {
        const empty =
          pk.name.trim() === "" &&
          !pk.requests.some(requestFilled) &&
          !pk.benefits.some((b) => b.trim() !== "");
        // Paket yang benar-benar kosong diabaikan bila masih ada paket lain
        // yang terisi — pengguna mungkin sekadar menyisakan baris kosong.
        if (empty && packages.length > 1) return;
        if (!pk.name.trim()) e.add(`pkg.${i}.name`);
        if (!pk.requests.some(requestFilled)) e.add(`pkg.${i}.requests`);
        if (!pk.benefits.some((b) => b.trim() !== "")) e.add(`pkg.${i}.benefits`);
      });
      if (validPackages.length === 0) e.add("packages");
    }
    if (s === 2) {
      if ((form.documents ?? []).length === 0) e.add("documents");
    }
    return e;
  };

  const stepValid = (s: number): boolean => collectErrors(s).size === 0;
  const err = (key: string) => errors.has(key);
  /* Hapus tanda merah begitu pengguna memperbaiki isian terkait. */
  const clearErr = (...keys: string[]) =>
    setErrors((prev) => {
      if (!keys.some((k) => prev.has(k))) return prev;
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });

  const persistDraft = async () => {
    // Draf disimpan longgar; yang penting isian pengguna tidak hilang.
    const draft = normalize({ ...form }, true);
    // Aturan basis data: selain status draf, pengajuan wajib punya minimal satu
    // paket. Tanpa penjagaan ini permintaan gagal dengan galat 500.
    if (draft.status !== "draf" && draft.packages.length === 0) {
      setErrors(new Set(["packages"]));
      setStep(1);
      return;
    }
    try {
      await savePengajuan(draft);
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
    // Cari langkah pertama yang bermasalah, tandai field-nya, lalu buka langkah itu.
    for (const s of [0, 1, 2]) {
      const e = collectErrors(s);
      if (e.size) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setErrors(new Set());
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
    const e = collectErrors(step);
    if (e.size) {
      setErrors(e);
      return;
    }
    setErrors(new Set());
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

        {isRevision && (
          <div className="sh-notice sh-notice--info" style={{ marginBottom: 16 }}>
            <strong>Mode revisi.</strong> Mitra sponsor sudah meninjau pengajuan ini, jadi yang
            dapat diubah hanya <strong>Paket sponsorship</strong> (detail permintaan & benefit).
            Informasi umum dan dokumen dikunci agar isi yang sudah ditinjau tetap sama.
          </div>
        )}

        <section className="sh-card">
          {/* STEP 0 — Informasi umum */}
          {step === 0 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">1. Informasi umum event</h3>
              <div className="sh-form-grid">
                <div className={`sh-field sh-field--wide${err("eventName") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Nama event</label>
                  <input
                    value={form.eventName}
                    disabled={locked}
                    onChange={(e) => {
                      set({ eventName: e.target.value });
                      clearErr("eventName");
                    }}
                    placeholder="Misal: Konser Amal Akhir Tahun"
                  />
                  <FieldError show={err("eventName")}>Nama event wajib diisi.</FieldError>
                </div>
                <div className={`sh-field${err("eventLocation") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Lokasi event</label>
                  <input
                    value={form.eventLocation}
                    disabled={locked}
                    onChange={(e) => {
                      set({ eventLocation: e.target.value });
                      clearErr("eventLocation");
                    }}
                    placeholder="Misal: Balai Sarbini, Jakarta"
                  />
                  <FieldError show={err("eventLocation")}>Lokasi event wajib diisi.</FieldError>
                </div>
                <div className={`sh-field${err("eventDate") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Tanggal event</label>
                  <input
                    type="date"
                    value={form.eventDate}
                    disabled={locked}
                    min={todayIso}
                    onChange={(e) => {
                      set({ eventDate: e.target.value });
                      clearErr("eventDate");
                    }}
                  />
                  <FieldError show={err("eventDate")}>
                    Tanggal event tidak boleh sebelum hari ini.
                  </FieldError>
                </div>
                <div className={`sh-field sh-field--wide${err("description") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Deskripsi lengkap event</label>
                  <textarea
                    value={form.description}
                    disabled={locked}
                    onChange={(e) => {
                      set({ description: e.target.value });
                      clearErr("description");
                    }}
                    placeholder="Ceritakan tujuan, cakupan, dan target audiens event."
                  />
                  <FieldError show={err("description")}>Deskripsi event wajib diisi.</FieldError>
                </div>
                <div className={`sh-field${err("eventBudget") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Total anggaran event (Rp)</label>
                  <CurrencyInput
                    value={form.eventBudget}
                    disabled={locked}
                    onChange={(n) => {
                      set({ eventBudget: n });
                      clearErr("eventBudget");
                    }}
                    placeholder="Misal: 300.000.000"
                  />
                  <FieldError show={err("eventBudget")}>
                    Total anggaran wajib diisi dan lebih dari 0.
                  </FieldError>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Paket sponsorship */}
          {step === 1 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">2. Paket sponsorship</h3>
              <p className="sh-muted" style={{ marginTop: -6, marginBottom: 18 }}>
                Susun paket yang bisa dipilih mitra sponsor. Tiap paket: nama, detail permintaan
                (in-cash / in-kind), dan benefit untuk mitra sponsor.
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

                    <div
                      className={`sh-field${err(`pkg.${pi}.name`) ? " sh-field--invalid" : ""}`}
                      style={{ marginBottom: 8, maxWidth: 320 }}
                    >
                      <label className="sh-field__label">Nama paket</label>
                      <input
                        value={pk.name}
                        onChange={(e) => {
                          setPackage(pi, { name: e.target.value });
                          clearErr(`pkg.${pi}.name`, "packages");
                        }}
                        placeholder="Misal: Gold"
                      />
                      <FieldError show={err(`pkg.${pi}.name`)}>Nama paket wajib diisi.</FieldError>
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
                    <FieldError show={err(`pkg.${pi}.requests`)}>
                      Isi minimal satu detail permintaan (nominal in-cash atau spesifikasi in-kind).
                    </FieldError>

                    <PointEditor
                      label="Benefit untuk mitra sponsor"
                      hint="Imbalan/keuntungan yang didapat mitra sponsor pada paket ini."
                      placeholder="Misal: Logo di poster kegiatan"
                      values={pk.benefits}
                      invalid={err(`pkg.${pi}.benefits`)}
                      onChange={(li, v) => {
                        setBenefit(pi, li, v);
                        clearErr(`pkg.${pi}.benefits`, "packages");
                      }}
                      onAdd={() => addBenefit(pi)}
                      onRemove={(li) => removeBenefit(pi, li)}
                    />
                    <FieldError show={err(`pkg.${pi}.benefits`)}>
                      Isi minimal satu benefit untuk mitra sponsor.
                    </FieldError>
                  </div>
                ))}
              </div>

              <FieldError show={err("packages")}>
                Minimal satu paket harus lengkap: nama, detail permintaan, dan benefit.
              </FieldError>

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
              {locked && (
                <div className="sh-row" style={{ gap: 6, marginBottom: 10, color: "var(--ink-500)", fontSize: 13 }}>
                  <Lock size={14} style={{ flex: "none" }} />
                  Dokumen dikunci selama revisi.
                </div>
              )}
              <FieldError show={err("documents")}>
                Unggah minimal satu berkas proposal (PDF).
              </FieldError>
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
                          disabled={locked}
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
                disabled={locked}
                style={{
                  marginBottom: 16,
                  width: "100%",
                  cursor: locked ? "not-allowed" : "pointer",
                  opacity: locked ? 0.55 : 1,
                }}
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
                  disabled={locked}
                  onChange={(e) => set({ extraNote: e.target.value })}
                  placeholder="Informasi lain yang ingin disampaikan ke mitra sponsor."
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">4. Review pengajuan</h3>
              <div className="sh-stack">
                <ReviewRow label="Mitra Sponsor tujuan" value={`${funder.name} · ${funder.type}`} />
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
                Setelah dikirim, pengajuan masuk ke mitra sponsor untuk ditinjau. Mitra Sponsor memilih
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

/** Pesan galat di bawah field — menggantikan toast di pojok layar agar
 *  pengguna langsung tahu bagian mana yang perlu diperbaiki. */
function FieldError({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div
      className="sh-row"
      style={{ gap: 6, marginTop: 6, color: "var(--status-failed)", fontSize: 13 }}
    >
      <AlertCircle size={14} style={{ flex: "none" }} />
      <span>{children}</span>
    </div>
  );
}

function PointEditor({
  label,
  hint,
  placeholder,
  values,
  invalid,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  invalid?: boolean;
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
      <div style={{ display: "grid", gap: 8 }} className={invalid ? "sh-field--invalid" : undefined}>
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
        Apa yang diminta organisasi dari mitra sponsor. Pilih jenis tiap poin: In-Cash (dana) atau
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
          <div className="sh-meta-label">Benefit untuk mitra sponsor</div>
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
