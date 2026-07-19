import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, Navigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { formatEventDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge, requestLabel } from "@/lib/pengajuan";
import type { SponsorshipPackage } from "@/lib/types";
import {
  ArrowLeft,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
} from "lucide-react";

export default function FunderPengajuanReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, currentUser } = useStore();
  const { approvePengajuan, rejectPengajuan, requestRevisionPengajuan } = useActions();
  const toast = useToast();

  const funderId = currentUser?.funderId ?? "";
  const pengajuan = state.pengajuan.find((p) => p.id === id) ?? null;

  const [selectedPkg, setSelectedPkg] = useState<number | null>(
    pengajuan?.selectedPackage ?? null,
  );
  const [preview, setPreview] = useState<{ index: number; name: string; data: string | null } | null>(
    null,
  );
  const [action, setAction] = useState<"revisi" | "tolak" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const org = useMemo(
    () => state.organizations.find((o) => o.id === pengajuan?.orgId),
    [state.organizations, pengajuan?.orgId],
  );
  const funder = state.funders.find((f) => f.id === pengajuan?.funderId);

  // Pengajuan tidak ada atau bukan milik pendana ini → kembali ke inbox.
  if (!pengajuan || pengajuan.funderId !== funderId) {
    return <Navigate to="/funder/pengajuan" replace />;
  }

  const badge = pengajuanBadge(pengajuan.status);
  const packages = pengajuan.packages ?? [];
  const documents = pengajuan.documents ?? [];
  const canReview = pengajuan.status === "diajukan" || pengajuan.status === "perlu_revisi";
  const chosenIdx = canReview ? selectedPkg : pengajuan.selectedPackage ?? null;

  const openPreview = (index: number, name: string) => {
    setPreview({ index, name, data: null });
    api
      .pengajuanDoc(pengajuan.id, index)
      .then((d) => setPreview((cur) => (cur && cur.index === index ? { ...cur, data: d } : cur)))
      .catch(() => setPreview((cur) => (cur && cur.index === index ? { ...cur, data: "" } : cur)));
  };

  const doApprove = async () => {
    if (selectedPkg == null) return;
    setBusy(true);
    try {
      await approvePengajuan(pengajuan.id, selectedPkg);
      toast.success(`Pengajuan "${pengajuan.eventName}" disetujui.`);
      navigate("/funder/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal menyetujui."));
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!action) return;
    if (!note.trim()) {
      toast.failed("Tulis catatan dulu untuk organisasi.");
      return;
    }
    setBusy(true);
    try {
      if (action === "revisi") {
        await requestRevisionPengajuan(pengajuan.id, note.trim());
        toast.info(`Feedback dikirim untuk "${pengajuan.eventName}".`);
      } else {
        await rejectPengajuan(pengajuan.id, note.trim());
        toast.failed(`Pengajuan "${pengajuan.eventName}" ditolak.`);
      }
      navigate("/funder/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Gagal memproses."));
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar title="Tinjau pengajuan" />
      <div className="sh-shell__content">
        <PageHead
          title={pengajuan.eventName || "Detail pengajuan"}
          subtitle={`${org?.name ?? "—"} · ${pengajuan.id}`}
          actions={
            <>
              <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
              <Link to="/funder/pengajuan" className="sh-btn sh-btn--secondary">
                <ArrowLeft size={16} />
                Kembali
              </Link>
            </>
          }
        />

        {pengajuan.status === "perlu_revisi" && pengajuan.revisionNote && (
          <div className="sh-notice" style={{ marginBottom: 16 }}>
            <strong>Feedback Anda sebelumnya:</strong> {pengajuan.revisionNote}
          </div>
        )}

        {/* Info + Dokumen */}
        <section className="sh-card" style={{ marginBottom: 16 }}>
          <div
            className="sh-card__body"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <Field label="Organisasi">{org?.name ?? "—"}</Field>
                <Field label="Pendana tujuan">{funder?.name ?? "—"}</Field>
                <Field label="Lokasi">{pengajuan.eventLocation || "—"}</Field>
                <Field label="Tanggal">{formatEventDate(pengajuan.eventDate)}</Field>
                <Field label="Total anggaran">{formatRupiah(pengajuan.eventBudget)}</Field>
              </div>
              <div style={{ marginTop: 16 }}>
                <Field label="Deskripsi">{pengajuan.description || "—"}</Field>
              </div>
            </div>

            <div>
              <div className="sh-meta-label" style={{ marginBottom: 8 }}>
                Dokumen pendukung ({documents.length})
              </div>
              {documents.length === 0 ? (
                <p className="sh-muted">Belum ada dokumen.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {documents.map((doc, i) => (
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
                        <FileText size={18} style={{ color: "var(--status-failed)", flex: "none" }} />
                        <span style={{ fontWeight: 600, wordBreak: "break-all", fontSize: 13 }}>
                          {doc.name}
                        </span>
                      </div>
                      <button
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        onClick={() => openPreview(i, doc.name)}
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
        </section>

        {/* Paket sponsorship */}
        <section className="sh-card" style={{ marginBottom: 16 }}>
          <header className="sh-card__header">
            <div>
              <h2>Paket Sponsorship yang Diajukan</h2>
              {canReview && (
                <p className="sh-muted" style={{ margin: "4px 0 0" }}>
                  Pilih paket sponsorship yang ingin Anda danai dari opsi yang diajukan organisasi.
                </p>
              )}
            </div>
          </header>
          <div className="sh-card__body">
            {packages.length === 0 ? (
              <p className="sh-muted">Belum ada paket.</p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 16,
                }}
              >
                {packages.map((pk, i) => (
                  <PackageCard
                    key={i}
                    pkg={pk}
                    index={i}
                    selectable={canReview}
                    selected={chosenIdx === i}
                    onSelect={() => canReview && setSelectedPkg(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Aksi tinjauan */}
        {canReview && (
          <div className="sh-row" style={{ justifyContent: "flex-end", gap: 10 }}>
            <button
              className="sh-btn sh-btn--warning"
              onClick={() => {
                setNote("");
                setAction("revisi");
              }}
              disabled={busy}
            >
              <MessageSquareWarning size={16} />
              Minta Revisi
            </button>
            <button
              className="sh-btn sh-btn--secondary"
              onClick={() => {
                setNote("");
                setAction("tolak");
              }}
              disabled={busy}
            >
              <XCircle size={16} />
              Tolak
            </button>
            <button
              className="sh-btn sh-btn--primary"
              disabled={selectedPkg == null || busy}
              style={selectedPkg == null ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
              onClick={doApprove}
            >
              <CheckCircle2 size={16} />
              Setujui Pendanaan
            </button>
          </div>
        )}
      </div>

      {/* Pratinjau dokumen */}
      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title={preview.name || "Pratinjau dokumen"}
          width={760}
        >
          {preview.data === null ? (
            <p className="sh-muted">Memuat dokumen…</p>
          ) : preview.data ? (
            <PdfPreview dataUrl={preview.data} fileName={preview.name} />
          ) : (
            <p className="sh-muted">Dokumen tidak dapat dimuat.</p>
          )}
        </Modal>
      )}

      {/* Catatan feedback / penolakan */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === "revisi" ? "Minta revisi" : "Tolak pengajuan"}
        footer={
          <>
            <button className="sh-btn sh-btn--secondary" onClick={() => setAction(null)} disabled={busy}>
              Batal
            </button>
            <button
              className={`sh-btn ${action === "revisi" ? "sh-btn--warning" : "sh-btn--danger"}`}
              onClick={confirmAction}
              disabled={busy}
            >
              {action === "revisi" ? "Kirim feedback" : "Tolak pengajuan"}
            </button>
          </>
        }
      >
        <div className="sh-field">
          <label className="sh-field__label">
            {action === "revisi" ? "Feedback untuk organisasi" : "Alasan penolakan"}
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              action === "revisi"
                ? "Tulis masukan/feedback yang perlu diperbaiki organisasi."
                : "Jelaskan alasan penolakan."
            }
          />
        </div>
      </Modal>
    </>
  );
}

function PackageCard({
  pkg,
  index,
  selectable,
  selected,
  onSelect,
}: {
  pkg: SponsorshipPackage;
  index: number;
  selectable: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      style={{
        border: `1px solid ${selected ? "var(--brand-500)" : "var(--line)"}`,
        outline: selected ? "1px solid var(--brand-500)" : "none",
        borderRadius: "var(--radius-lg)",
        padding: 18,
        cursor: selectable ? "pointer" : "default",
        background: selected ? "var(--brand-50, var(--canvas-tint))" : "var(--canvas)",
      }}
    >
      <div className="sh-row" style={{ gap: 10, marginBottom: 12 }}>
        {selectable && (
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              border: `2px solid ${selected ? "var(--brand-500)" : "var(--line-strong)"}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            {selected && (
              <span
                style={{ width: 8, height: 8, borderRadius: 999, background: "var(--brand-500)" }}
              />
            )}
          </span>
        )}
        <strong style={{ fontSize: 16 }}>{pkg.name || `Paket ${index + 1}`}</strong>
        {selected && !selectable && (
          <StatusBadge kind="custom" label="Dipilih" variant="success" />
        )}
      </div>
      {pkg.requests.length > 0 && (
        <div style={{ marginBottom: 10 }}>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="sh-meta-label">{label}</div>
      <div className="sh-meta-value" style={{ fontWeight: 600 }}>
        {children}
      </div>
    </div>
  );
}
