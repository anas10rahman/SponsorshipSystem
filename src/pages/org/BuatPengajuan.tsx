import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatEventDate, formatRupiah, makePengajuanId, nowIso } from "@/lib/format";
import { SUBMISSION_FEE } from "@/lib/pengajuan";
import type { InKindItem, Pengajuan, SponsorshipType } from "@/lib/types";
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
} from "lucide-react";

const STEPS = ["Informasi umum", "Detail sponsorship", "Dokumen", "Review"] as const;

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
    if (editing) return editing;
    return {
      id: makePengajuanId(state.pengajuan.length + 1),
      orgId,
      funderId: preselectedFunder,
      eventName: "",
      eventLocation: "",
      eventDate: "",
      description: "",
      eventBudget: 0,
      type: "in_cash",
      requestedAmount: 0,
      inKindItems: [{ name: "", qty: 1, unit: "Unit" }],
      benefits: [],
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

  // ---- Item helpers (in-kind) ----
  const items = form.inKindItems ?? [];
  const setItem = (i: number, patch: Partial<InKindItem>) =>
    set({ inKindItems: items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const addItem = () =>
    set({ inKindItems: [...items, { name: "", qty: 1, unit: "Unit" }] });
  const removeItem = (i: number) =>
    set({ inKindItems: items.filter((_, idx) => idx !== i) });

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

  // In-cash: nominal yang diajukan = total anggaran event.
  const normalize = (f: Pengajuan): Pengajuan => ({
    ...f,
    requestedAmount: f.type === "in_cash" ? f.eventBudget : undefined,
    benefits: [],
    updatedAt: nowIso(),
  });

  // ---- Validation per step ----
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
      if (form.type === "in_cash") return form.eventBudget > 0;
      return items.some((it) => it.name.trim() !== "" && it.qty > 0);
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
    if (!stepValid(0) || !stepValid(1)) {
      toast.failed("Masih ada kolom wajib yang kosong.");
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

          {/* STEP 1 — Detail sponsorship */}
          {step === 1 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">2. Detail sponsorship</h3>

              <div className="sh-field" style={{ marginBottom: 20 }}>
                <label className="sh-field__label">Jenis sponsorship</label>
                <div className="sh-row" style={{ gap: 8 }}>
                  {(["in_cash", "in_kind"] as SponsorshipType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`sh-chip${form.type === t ? " is-active" : ""}`}
                      onClick={() => set({ type: t })}
                    >
                      {t === "in_cash" ? "In-Cash (uang)" : "In-Kind (barang)"}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === "in_cash" ? (
                <div>
                  <div className="sh-field" style={{ maxWidth: 360 }}>
                    <label className="sh-field__label">Total anggaran event (Rp)</label>
                    <input type="number" value={form.eventBudget || ""} disabled />
                    <span className="sh-field__hint">
                      Nominal yang diajukan ke pendana mengikuti total anggaran event.
                      Ubah di langkah 1 bila perlu.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="sh-meta-label" style={{ marginBottom: 8 }}>
                    Daftar kebutuhan barang
                  </div>
                  <div className="sh-table-wrap">
                    <table className="sh-table" style={{ minWidth: 480 }}>
                      <thead>
                        <tr>
                          <th>Nama barang</th>
                          <th style={{ width: 110 }}>Jumlah</th>
                          <th style={{ width: 130 }}>Satuan</th>
                          <th style={{ width: 56 }} />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, i) => (
                          <tr key={i}>
                            <td>
                              <input
                                className="sh-input"
                                value={it.name}
                                onChange={(e) => setItem(i, { name: e.target.value })}
                                placeholder="Misal: Laptop untuk peserta"
                              />
                            </td>
                            <td>
                              <input
                                className="sh-input"
                                type="number"
                                min={1}
                                value={it.qty}
                                onChange={(e) => setItem(i, { qty: Number(e.target.value) })}
                              />
                            </td>
                            <td>
                              <input
                                className="sh-input"
                                value={it.unit}
                                onChange={(e) => setItem(i, { unit: e.target.value })}
                                placeholder="Unit / Pcs"
                              />
                            </td>
                            <td>
                              <button
                                className="sh-btn sh-btn--ghost sh-btn--icon"
                                onClick={() => removeItem(i)}
                                title="Hapus baris"
                                disabled={items.length <= 1}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    className="sh-btn sh-btn--secondary sh-btn--sm"
                    onClick={addItem}
                    style={{ marginTop: 12 }}
                  >
                    <Plus size={14} />
                    Tambah barang
                  </button>
                </div>
              )}
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
                <ReviewRow
                  label={form.type === "in_cash" ? "Total anggaran / nominal diajukan" : "Total anggaran"}
                  value={formatRupiah(form.eventBudget)}
                />
                <ReviewRow
                  label="Jenis"
                  value={form.type === "in_cash" ? "In-Cash (uang)" : "In-Kind (barang)"}
                />
                {form.type === "in_kind" && (
                  <div>
                    <div className="sh-meta-label">Barang yang diminta</div>
                    <ul style={{ margin: "6px 0 0 18px" }}>
                      {items
                        .filter((it) => it.name.trim())
                        .map((it, i) => (
                          <li key={i}>
                            {it.name} — {it.qty} {it.unit}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
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
                Setelah dikirim, pengajuan masuk ke pendana untuk ditinjau. Pendana dapat
                menyetujui, menolak, atau meminta revisi.
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
