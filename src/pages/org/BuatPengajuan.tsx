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
  MessageSquareWarning,
} from "lucide-react";

const STEPS = ["Informasi umum", "Sponsorship package", "Documents", "Review"] as const;

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
          action: "Submission created",
          actor: "Organization",
          note: "Submission draft started.",
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
  /* Paket yang diminta diperbaiki mitra sponsor. Saat revisi, hanya paket ini
     yang boleh diubah; paket lain dikunci agar penawaran yang sudah ditinjau
     tidak berubah diam-diam. */
  const revisedIdx = isRevision ? (form.selectedPackage ?? null) : null;
  const pkgLocked = (i: number) => isRevision && revisedIdx !== null && i !== revisedIdx;

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
        <Topbar title="Create submission" />
        <div className="sh-shell__content">
          <Empty
            title="No sponsor partner selected"
            description="Pick a sponsor partner first from the Find sponsor partners page."
            action={
              <Link to="/org/cari" className="sh-btn sh-btn--primary">
                Go to Find sponsor partners
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
  /* In-Cash dibatasi satu per paket (dana tunai cukup satu angka); In-Kind
     boleh banyak. Poin baru otomatis In-Kind bila In-Cash sudah terpakai. */
  const hasCash = (pi: number, exceptIdx = -1) =>
    packages[pi].requests.some((r, idx) => idx !== exceptIdx && r.type === "in_cash");
  const addRequest = (pi: number) =>
    setPackage(pi, {
      requests: [
        ...packages[pi].requests,
        hasCash(pi) ? { type: "in_kind" as const, amount: 0, spec: "" } : emptyRequest(),
      ],
    });
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
        toast.failed(`"${file.name}" is already added.`);
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
        // Paket terkunci sudah pernah ditinjau — jangan halangi pengguna karenanya.
        if (pkgLocked(i)) return;
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
      toast.success("Submission saved as a draft.");
      navigate("/org/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not save."));
    }
  };

  const finalSubmit = async () => {
    if (org && org.verificationStatus !== "terverifikasi") {
      toast.failed("Your organization is not admin-verified yet. Request verification from the Dashboard first.");
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
        `Not enough balance for the ${formatRupiah(SUBMISSION_FEE)} submission fee. Top up first.`,
      );
      navigate("/org/topup");
      return;
    }
    try {
      await submitPengajuan(normalize(form));
      toast.success(`Submission "${form.eventName}" sent to ${funder.name}.`);
      navigate("/org/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not send the submission."));
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
      <Topbar title={editing ? "Continue submission" : "Create submission"} />
      <div className="sh-shell__content">
        <PageHead
          title={editing ? "Continue submission" : "Create submission"}
          subtitle={`Submission addressed to ${funder.name} (${funder.type}).`}
          actions={
            <Link to="/org/cari" className="sh-btn sh-btn--secondary">
              <ArrowLeft size={16} />
              Back
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
            <strong>Revision mode.</strong> The sponsor partner has already reviewed this submission, so
            only the <strong>Sponsorship package</strong> can change (request details & benefits).
            General information and documents are locked so the reviewed content stays the same.
          </div>
        )}

        <section className="sh-card">
          {/* STEP 0 — Informasi umum */}
          {step === 0 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">1. Informasi umum event</h3>
              <div className="sh-form-grid">
                <div className={`sh-field sh-field--wide${err("eventName") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Event name</label>
                  <input
                    value={form.eventName}
                    disabled={locked}
                    onChange={(e) => {
                      set({ eventName: e.target.value });
                      clearErr("eventName");
                    }}
                    placeholder="e.g. Year-End Charity Concert"
                  />
                  <FieldError show={err("eventName")}>Event name is required.</FieldError>
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
                  <FieldError show={err("eventLocation")}>Event location is required.</FieldError>
                </div>
                <div className={`sh-field${err("eventDate") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Event date</label>
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
                    The event date cannot be before today.
                  </FieldError>
                </div>
                <div className={`sh-field sh-field--wide${err("description") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Full event description</label>
                  <textarea
                    value={form.description}
                    disabled={locked}
                    onChange={(e) => {
                      set({ description: e.target.value });
                      clearErr("description");
                    }}
                    placeholder="Describe the goal, scope, and target audience of the event."
                  />
                  <FieldError show={err("description")}>Event description is required.</FieldError>
                </div>
                <div className={`sh-field${err("eventBudget") ? " sh-field--invalid" : ""}`}>
                  <label className="sh-field__label">Total event budget (Rp)</label>
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
                    Total budget is required and must be greater than 0.
                  </FieldError>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Paket sponsorship */}
          {step === 1 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">2. Sponsorship package</h3>
              <p className="sh-muted" style={{ marginTop: -6, marginBottom: 18 }}>
                Susun paket yang bisa dipilih mitra sponsor. Tiap paket: nama, detail permintaan
                (in-cash / in-kind), dan benefit untuk mitra sponsor.
              </p>

              <div style={{ display: "grid", gap: 16 }}>
                {packages.map((pk, pi) => (
                  <div
                    key={pi}
                    className={pkgLocked(pi) ? "dm-locked" : undefined}
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
                        <strong>
                          Paket {pi + 1}
                          {pk.name.trim() ? ` — ${pk.name.trim()}` : ""}
                        </strong>
                        {pkgLocked(pi) && (
                          <span className="dm-locked__badge">
                            <Lock size={12} />
                            Not revised
                          </span>
                        )}
                      </div>
                      <button
                        className="sh-btn sh-btn--ghost sh-btn--icon"
                        onClick={() => removePackage(pi)}
                        title="Remove package"
                        disabled={packages.length <= 1 || isRevision}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {isRevision && pi === revisedIdx && form.revisionNote && (
                      <div className="dm-revnote">
                        <MessageSquareWarning size={16} />
                        <div>
                          <strong>Revision notes from the sponsor partner:</strong> {form.revisionNote}
                        </div>
                      </div>
                    )}

                    <div
                      className={`sh-field${err(`pkg.${pi}.name`) ? " sh-field--invalid" : ""}`}
                      style={{ marginBottom: 8, maxWidth: 320 }}
                    >
                      <label className="sh-field__label">Package name</label>
                      <input
                        value={pk.name}
                        disabled={pkgLocked(pi)}
                        onChange={(e) => {
                          setPackage(pi, { name: e.target.value });
                          clearErr(`pkg.${pi}.name`, "packages");
                        }}
                        placeholder="Misal: Gold"
                      />
                      <FieldError show={err(`pkg.${pi}.name`)}>Package name is required.</FieldError>
                    </div>

                    <RequestEditor
                      requests={pk.requests}
                      total={packageAmount(pk)}
                      cashTakenBy={pk.requests.findIndex((r) => r.type === "in_cash")}
                      disabled={pkgLocked(pi)}
                      onChangeType={(li, t) =>
                        setRequest(pi, li, { type: t, amount: 0, spec: "" })
                      }
                      onChangeAmount={(li, n) => setRequest(pi, li, { amount: n })}
                      onChangeSpec={(li, v) => setRequest(pi, li, { spec: v })}
                      onAdd={() => addRequest(pi)}
                      onRemove={(li) => removeRequest(pi, li)}
                    />
                    <FieldError show={err(`pkg.${pi}.requests`)}>
                      Fill in at least one request detail (in-cash amount or in-kind specification).
                    </FieldError>

                    <PointEditor
                      label="Benefits for the sponsor partner"
                      hint="What the sponsor partner gets in return under this package."
                      placeholder="e.g. Logo on the event poster"
                      values={pk.benefits}
                      invalid={err(`pkg.${pi}.benefits`)}
                      disabled={pkgLocked(pi)}
                      onChange={(li, v) => {
                        setBenefit(pi, li, v);
                        clearErr(`pkg.${pi}.benefits`, "packages");
                      }}
                      onAdd={() => addBenefit(pi)}
                      onRemove={(li) => removeBenefit(pi, li)}
                    />
                    <FieldError show={err(`pkg.${pi}.benefits`)}>
                      Add at least one benefit for the sponsor partner.
                    </FieldError>
                  </div>
                ))}
              </div>

              <FieldError show={err("packages")}>
                At least one package must be complete: name, request details, and benefits.
              </FieldError>

              <button
                className="sh-btn sh-btn--secondary sh-btn--sm"
                onClick={addPackage}
                disabled={isRevision}
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
                Supporting files (PDF) — required, more than one allowed
              </div>
              {locked && (
                <div className="sh-row" style={{ gap: 6, marginBottom: 10, color: "var(--ink-500)", fontSize: 13 }}>
                  <Lock size={14} style={{ flex: "none" }} />
                  Dokumen dikunci selama revisi.
                </div>
              )}
              <FieldError show={err("documents")}>
                Upload at least one proposal file (PDF).
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
                          title="Remove file"
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
                    ? "Add another file."
                    : "Click to upload supporting files."}
                </span>
                <span className="sh-muted" style={{ fontSize: 12 }}>
                  Multiple files allowed · PDF only · max 4 MB per file.
                </span>
              </button>
              <div className="sh-field">
                <label className="sh-field__label">Additional notes (optional)</label>
                <textarea
                  rows={3}
                  value={form.extraNote ?? ""}
                  disabled={locked}
                  onChange={(e) => set({ extraNote: e.target.value })}
                  placeholder="Anything else you want the sponsor partner to know."
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">4. Review submission</h3>
              <div className="sh-stack">
                <ReviewRow label="Target Sponsor Partner" value={`${funder.name} · ${funder.type}`} />
                <ReviewRow label="Event name" value={form.eventName || "—"} />
                <ReviewRow label="Lokasi" value={form.eventLocation || "—"} />
                <ReviewRow label="Date" value={formatEventDate(form.eventDate)} />
                <ReviewRow label="Description" value={form.description || "—"} />
                <ReviewRow label="Total event budget" value={formatRupiah(form.eventBudget)} />
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
                    Your balance will be charged <strong>{formatRupiah(SUBMISSION_FEE)}</strong>{" "}
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
                      Top up your balance first
                    </Link>
                    .
                  </div>
                ))}

              {notVerified && (
                <div className="sh-notice sh-notice--failed" style={{ marginTop: 12 }}>
                  Your organization is not admin-verified yet, so the submission cannot be sent. You can
                  still save it as a draft.{" "}
                  <Link to="/org/dashboard" style={{ fontWeight: 700 }}>
                    Request verification from the Dashboard
                  </Link>
                  .
                </div>
              )}

              <div className="sh-notice sh-notice--info" style={{ marginTop: 12 }}>
                Once sent, the submission goes to the sponsor partner for review. They pick one package
                and approve it, or reject it / request a revision.
              </div>
            </div>
          )}

          {/* Footer nav */}
          <div className="sh-card__footer">
            <button className="sh-btn sh-btn--secondary" onClick={persistDraft}>
              <Save size={16} />
              Save draft
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
                Send submission
              </button>
            )}
          </div>
        </section>
      </div>

      {previewDoc && (
        <Modal
          open
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.name || "Document preview"}
          width={760}
        >
          {previewDoc.data ? (
            <PdfPreview dataUrl={previewDoc.data} fileName={previewDoc.name} />
          ) : (
            <p className="sh-muted">The document could not be loaded.</p>
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
  disabled,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  hint?: string;
  placeholder: string;
  values: string[];
  invalid?: boolean;
  disabled?: boolean;
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
              disabled={disabled}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder={placeholder}
            />
            <button
              className="sh-btn sh-btn--ghost sh-btn--icon"
              onClick={() => onRemove(i)}
              title="Remove item"
              disabled={disabled || values.length <= 1}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="sh-btn sh-btn--ghost sh-btn--sm"
        onClick={onAdd}
        disabled={disabled}
        style={{ marginTop: 8 }}
      >
        <Plus size={14} />
        Tambah poin
      </button>
    </div>
  );
}

/** Editor "Request details": tiap poin punya dropdown tipe (In-Cash / In-Kind).
 *  In-Cash → nominal rupiah berformat; In-Kind → spesifikasi barang. */
function RequestEditor({
  requests,
  total,
  cashTakenBy,
  disabled,
  onChangeType,
  onChangeAmount,
  onChangeSpec,
  onAdd,
  onRemove,
}: {
  requests: SponsorshipRequest[];
  total: number;
  /** Indeks poin yang sudah memakai In-Cash (-1 bila belum ada). */
  cashTakenBy: number;
  disabled?: boolean;
  onChangeType: (i: number, t: SponsorshipRequest["type"]) => void;
  onChangeAmount: (i: number, n: number) => void;
  onChangeSpec: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="sh-row sh-row--between" style={{ marginBottom: 2 }}>
        <div className="sh-field__label">Request details</div>
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
        What the organization is asking the sponsor partner for. Pick a type per item: In-Cash (funds) or
        In-Kind (goods/services). One In-Cash per package; In-Kind may repeat.
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {requests.map((r, i) => (
          <div key={i} className="sh-row" style={{ gap: 8, alignItems: "flex-start" }}>
            <select
              className="sh-input"
              style={{ flex: "none", width: 116 }}
              value={r.type}
              disabled={disabled}
              onChange={(e) => onChangeType(i, e.target.value as SponsorshipRequest["type"])}
            >
              <option value="in_cash" disabled={cashTakenBy !== -1 && cashTakenBy !== i}>
                In-Cash
              </option>
              <option value="in_kind">In-Kind</option>
            </select>
            {r.type === "in_cash" ? (
              <CurrencyInput
                value={r.amount}
                disabled={disabled}
                onChange={(n) => onChangeAmount(i, n)}
                placeholder="Nominal, mis: 5.000.000"
                style={{ flex: 1 }}
              />
            ) : (
              <input
                className="sh-input"
                style={{ flex: 1 }}
                value={r.spec}
                disabled={disabled}
                onChange={(e) => onChangeSpec(i, e.target.value)}
                placeholder="Spesifikasi barang, mis: 100 kaos katun ukuran M"
              />
            )}
            <button
              className="sh-btn sh-btn--ghost sh-btn--icon"
              onClick={() => onRemove(i)}
              title="Remove item"
              disabled={disabled || requests.length <= 1}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="sh-btn sh-btn--ghost sh-btn--sm"
        onClick={onAdd}
        disabled={disabled}
        style={{ marginTop: 8 }}
      >
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
          <div className="sh-meta-label">Request details</div>
          <ul style={{ margin: "4px 0 0 18px" }}>
            {pkg.requests.map((r, i) => (
              <li key={i}>{requestLabel(r)}</li>
            ))}
          </ul>
        </div>
      )}
      {pkg.benefits.length > 0 && (
        <div>
          <div className="sh-meta-label">Benefits for the sponsor partner</div>
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
