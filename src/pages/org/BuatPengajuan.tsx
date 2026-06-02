import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRupiah, makePengajuanId, nowIso } from "@/lib/format";
import type { InKindItem, Pengajuan, SponsorshipType } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Plus,
  Trash2,
  Check,
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
      if (form.type === "in_cash") return (form.requestedAmount ?? 0) > 0;
      return items.some((it) => it.name.trim() !== "" && it.qty > 0);
    }
    return true;
  };

  const persistDraft = () => {
    savePengajuan({ ...form, status: form.status === "draf" ? "draf" : form.status, updatedAt: nowIso() });
    toast.success("Pengajuan disimpan sebagai draf.");
    navigate("/org/pengajuan");
  };

  const finalSubmit = () => {
    if (!stepValid(0) || !stepValid(1)) {
      toast.failed("Masih ada kolom wajib yang kosong.");
      return;
    }
    submitPengajuan({ ...form, updatedAt: nowIso() });
    toast.success(`Pengajuan "${form.eventName}" dikirim ke ${funder.name}.`);
    navigate("/org/pengajuan");
  };

  const next = () => {
    if (!stepValid(step)) {
      toast.failed("Lengkapi kolom wajib di langkah ini dulu.");
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
                    value={form.eventDate}
                    onChange={(e) => set({ eventDate: e.target.value })}
                    placeholder="Misal: 20 Desember 2026"
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
                <div className="sh-form-grid">
                  <div className="sh-field">
                    <label className="sh-field__label">Total anggaran event (Rp)</label>
                    <input type="number" value={form.eventBudget || ""} disabled />
                  </div>
                  <div className="sh-field">
                    <label className="sh-field__label">Nominal diajukan ke pendana (Rp)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.requestedAmount || ""}
                      onChange={(e) => set({ requestedAmount: Number(e.target.value) })}
                      placeholder="Misal: 80000000"
                    />
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

              <div className="sh-field" style={{ marginTop: 20 }}>
                <label className="sh-field__label">Benefit untuk pendana</label>
                <textarea
                  rows={4}
                  value={(form.benefits ?? []).join("\n")}
                  onChange={(e) =>
                    set({
                      benefits: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={"Satu benefit per baris\nLogo di banner acara\nBooth pameran"}
                />
              </div>
            </div>
          )}

          {/* STEP 2 — Dokumen */}
          {step === 2 && (
            <div className="sh-form-section" style={{ borderBottom: 0 }}>
              <h3 className="sh-form-section__title">3. Dokumen pendukung</h3>
              <div className="sh-file-drop" style={{ marginBottom: 16 }}>
                <span>Seret berkas proposal (PDF) ke sini, atau klik untuk unggah.</span>
                <span className="sh-muted" style={{ fontSize: 12 }}>
                  Untuk demo, isi nama berkas saja.
                </span>
                <input
                  className="sh-input"
                  style={{ maxWidth: 360 }}
                  value={form.proposalDocUrl ?? ""}
                  onChange={(e) => set({ proposalDocUrl: e.target.value })}
                  placeholder="proposal-acara.pdf"
                />
              </div>
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
                <ReviewRow label="Tanggal" value={form.eventDate || "—"} />
                <ReviewRow label="Deskripsi" value={form.description || "—"} />
                <ReviewRow
                  label="Total anggaran"
                  value={formatRupiah(form.eventBudget)}
                />
                <ReviewRow
                  label="Jenis"
                  value={form.type === "in_cash" ? "In-Cash (uang)" : "In-Kind (barang)"}
                />
                {form.type === "in_cash" ? (
                  <ReviewRow
                    label="Nominal diajukan"
                    value={formatRupiah(form.requestedAmount ?? 0)}
                  />
                ) : (
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
                {form.benefits.length > 0 && (
                  <div>
                    <div className="sh-meta-label">Benefit untuk pendana</div>
                    <ul style={{ margin: "6px 0 0 18px" }}>
                      {form.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <ReviewRow label="Dokumen" value={form.proposalDocUrl || "—"} />
              </div>

              <div className="sh-notice sh-notice--info" style={{ marginTop: 16 }}>
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
              <button className="sh-btn sh-btn--primary" onClick={finalSubmit}>
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
