import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { nowIso } from "@/lib/format";
import type { Proposal } from "@/lib/types";
import { ArrowLeft, Save, Send } from "lucide-react";

const CATEGORIES = [
  "Teknologi",
  "Edukasi",
  "Hiburan",
  "Olahraga",
  "Kuliner",
  "Seni & Budaya",
  "Kesehatan",
  "Lingkungan",
];

type Mode = "baru" | "edit" | "view";

export default function OrgProposalEditor() {
  const { id } = useParams();
  const { state, currentUser } = useStore();
  const { saveProposal } = useActions();
  const toast = useToast();
  const navigate = useNavigate();

  const orgId = currentUser?.orgId ?? "";

  const mode: Mode = useMemo(() => {
    if (!id || id === "baru") return "baru";
    const url = window.location.pathname;
    if (url.endsWith("/edit")) return "edit";
    return "view";
  }, [id]);

  const existing = useMemo(
    () => (id && id !== "baru" ? state.proposals.find((p) => p.id === id) : undefined),
    [state.proposals, id],
  );

  const [form, setForm] = useState<Proposal>(() => {
    if (existing) return existing;
    return {
      id: `prop-${Date.now()}`,
      orgId,
      title: "",
      category: CATEGORIES[0],
      city: "",
      description: "",
      benefits: [],
      target: 0,
      raised: 0,
      status: "draf",
      supporters: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  });

  useEffect(() => {
    if (existing) setForm(existing);
  }, [existing]);

  // View mode (read-only summary)
  if (mode === "view") {
    if (!existing) {
      return (
        <>
          <Topbar title="Detail proposal" />
          <div className="sh-shell__content">
            <Empty title="Proposal tidak ditemukan" />
          </div>
        </>
      );
    }
    if (existing.orgId !== orgId) {
      return (
        <>
          <Topbar title="Detail proposal" />
          <div className="sh-shell__content">
            <Empty title="Proposal bukan milik Anda" />
          </div>
        </>
      );
    }
    return (
      <>
        <Topbar title={existing.title} />
        <div className="sh-shell__content">
          <PageHead
            title={existing.title}
            subtitle={`${existing.category} · ${existing.city}`}
            actions={
              <>
                <Link to="/org/proposal" className="sh-btn sh-btn--secondary">
                  <ArrowLeft size={16} />
                  Kembali
                </Link>
                <Link
                  to={`/org/proposal/${existing.id}/edit`}
                  className="sh-btn sh-btn--primary"
                >
                  Edit proposal
                </Link>
              </>
            }
          />
          <section className="sh-card">
            <div className="sh-card__body sh-stack">
              <div>
                <div className="sh-meta-label">Deskripsi</div>
                <p>{existing.description}</p>
              </div>
              <div>
                <div className="sh-meta-label">Benefit untuk pendana</div>
                <ul style={{ margin: "8px 0 0 16px" }}>
                  {existing.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="sh-row" style={{ gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div className="sh-meta-label">Target</div>
                  <div className="sh-meta-value num">
                    {new Intl.NumberFormat("id-ID").format(existing.target)}
                  </div>
                </div>
                <div>
                  <div className="sh-meta-label">Terkumpul</div>
                  <div className="sh-meta-value num">
                    {new Intl.NumberFormat("id-ID").format(existing.raised)}
                  </div>
                </div>
                <div>
                  <div className="sh-meta-label">Pendukung</div>
                  <div className="sh-meta-value">{existing.supporters.length} pendana</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // Validation
  const errors: Partial<Record<keyof Proposal, string>> = {};
  if (!form.title.trim()) errors.title = "Judul wajib diisi.";
  if (!form.city.trim()) errors.city = "Lokasi wajib diisi.";
  if (!form.description.trim()) errors.description = "Deskripsi wajib diisi.";
  if (form.target <= 0) errors.target = "Target dana harus lebih dari 0.";
  const valid = Object.keys(errors).length === 0;

  const submit = (publish: boolean) => {
    if (!valid) {
      toast.failed("Lengkapi semua kolom wajib dulu.");
      return;
    }
    const next: Proposal = {
      ...form,
      status: publish ? "aktif" : form.status,
      updatedAt: nowIso(),
      orgId, // ensure ownership
    };
    saveProposal(next);
    toast.success(
      publish
        ? `Proposal "${next.title}" dipublikasikan.`
        : `Proposal "${next.title}" disimpan.`,
    );
    navigate("/org/proposal");
  };

  const title = mode === "baru" ? "Buat proposal" : `Edit: ${form.title || "Proposal"}`;
  const subtitle =
    mode === "baru"
      ? "Isi detail proposal pendanaan. Simpan sebagai draf, atau publikasikan langsung."
      : "Perbarui detail proposal Anda.";

  return (
    <>
      <Topbar title={title} />
      <div className="sh-shell__content">
        <PageHead
          title={title}
          subtitle={subtitle}
          actions={
            <Link to="/org/proposal" className="sh-btn sh-btn--secondary">
              <ArrowLeft size={16} />
              Kembali
            </Link>
          }
        />

        <form
          className="sh-card"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div className="sh-form-section">
            <h3 className="sh-form-section__title">1. Informasi proposal</h3>
            <div className="sh-form-grid">
              <div className="sh-field sh-field--wide">
                <label className="sh-field__label">Judul proposal</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Misal: Festival Musik Nusantara"
                />
                {errors.title && <div className="sh-field__error">{errors.title}</div>}
              </div>
              <div className="sh-field">
                <label className="sh-field__label">Kategori</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sh-field">
                <label className="sh-field__label">Kota / Lokasi</label>
                <input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Misal: Jakarta"
                />
                {errors.city && <div className="sh-field__error">{errors.city}</div>}
              </div>
              <div className="sh-field sh-field--wide">
                <label className="sh-field__label">Deskripsi proposal</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Jelaskan secara singkat tujuan & cakupan kegiatan."
                />
                {errors.description && (
                  <div className="sh-field__error">{errors.description}</div>
                )}
              </div>
            </div>
          </div>

          <div className="sh-form-section">
            <h3 className="sh-form-section__title">2. Target pendanaan</h3>
            <div className="sh-form-grid">
              <div className="sh-field">
                <label className="sh-field__label">Target dana (Rp)</label>
                <input
                  type="number"
                  min={0}
                  value={form.target || ""}
                  onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
                  placeholder="Misal: 200000000"
                />
                {errors.target && <div className="sh-field__error">{errors.target}</div>}
              </div>
              <div className="sh-field">
                <label className="sh-field__label">Status saat ini</label>
                <input value={form.status} disabled />
              </div>
            </div>
          </div>

          <div className="sh-form-section">
            <h3 className="sh-form-section__title">3. Benefit untuk pendana</h3>
            <div className="sh-field">
              <label className="sh-field__label">
                Daftar benefit (pisahkan dengan baris baru)
              </label>
              <textarea
                rows={5}
                value={form.benefits.join("\n")}
                onChange={(e) =>
                  setForm({
                    ...form,
                    benefits: e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={"Logo di banner utama\nBooth eksklusif\nAkses tiket VIP"}
              />
            </div>
          </div>

          <div className="sh-form-section">
            <h3 className="sh-form-section__title">4. Dokumen pendukung</h3>
            <div className="sh-file-drop">
              <span>Seret berkas proposal (PDF) ke sini, atau klik untuk unggah.</span>
              <span className="sh-muted" style={{ fontSize: 12 }}>
                Untuk demo, isi nama berkas saja.
              </span>
              <input
                className="sh-input"
                style={{ maxWidth: 360 }}
                value={form.proposalDocUrl ?? ""}
                onChange={(e) => setForm({ ...form, proposalDocUrl: e.target.value })}
                placeholder="proposal-saya.pdf"
              />
            </div>
          </div>

          <div className="sh-card__footer" style={{ borderTop: 0 }}>
            <button type="submit" className="sh-btn sh-btn--secondary">
              <Save size={16} />
              Simpan draf
            </button>
            <button
              type="button"
              className="sh-btn sh-btn--primary"
              onClick={() => submit(true)}
            >
              <Send size={16} />
              {existing && existing.status === "aktif" ? "Simpan perubahan" : "Publikasikan"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
