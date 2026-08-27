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
import { packageAmount, pengajuanBadge, requestLabel } from "@/lib/pengajuan";
import type { SponsorshipPackage } from "@/lib/types";
import {
  ArrowLeft,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  MessageSquareWarning,
  Package as PackageIcon,
  AlertCircle,
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
  const [noteErr, setNoteErr] = useState(false);
  const [busy, setBusy] = useState(false);

  const org = useMemo(
    () => state.organizations.find((o) => o.id === pengajuan?.orgId),
    [state.organizations, pengajuan?.orgId],
  );
  const funder = state.funders.find((f) => f.id === pengajuan?.funderId);

  // Pengajuan tidak ada atau bukan milik mitra sponsor ini → kembali ke inbox.
  if (!pengajuan || pengajuan.funderId !== funderId) {
    return <Navigate to="/funder/pengajuan" replace />;
  }

  const badge = pengajuanBadge(pengajuan.status);
  const packages = pengajuan.packages ?? [];
  const documents = pengajuan.documents ?? [];
  const canReview = pengajuan.status === "diajukan" || pengajuan.status === "perlu_revisi";
  // Paket yang sedang dipilih — tampil di dialog minta revisi.
  const revisedPkg = selectedPkg != null ? pengajuan.packages[selectedPkg] : undefined;
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
      toast.success(`Submission "${pengajuan.eventName}" approved.`);
      navigate("/funder/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not approve."));
      setBusy(false);
    }
  };

  const confirmAction = async () => {
    if (!action) return;
    if (!note.trim()) {
      setNoteErr(true);
      return;
    }
    setBusy(true);
    try {
      if (action === "revisi") {
        if (selectedPkg == null) {
          toast.failed("Pick the package to revise first.");
          setBusy(false);
          return;
        }
        await requestRevisionPengajuan(pengajuan.id, note.trim(), selectedPkg);
        toast.info(`Feedback sent for "${pengajuan.eventName}".`);
      } else {
        await rejectPengajuan(pengajuan.id, note.trim());
        toast.failed(`Submission "${pengajuan.eventName}" rejected.`);
      }
      navigate("/funder/pengajuan");
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not process."));
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar title="Review submission" />
      <div className="sh-shell__content">
        <PageHead
          title={pengajuan.eventName || "Submission details"}
          subtitle={`${org?.name ?? "—"} · ${pengajuan.id}`}
          actions={
            <>
              <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
              <Link to="/funder/pengajuan" className="sh-btn sh-btn--secondary">
                <ArrowLeft size={16} />
                Back
              </Link>
            </>
          }
        />

        {pengajuan.status === "perlu_revisi" && pengajuan.revisionNote && (
          <div className="sh-notice" style={{ marginBottom: 16 }}>
            <strong>Your previous feedback:</strong> {pengajuan.revisionNote}
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
                <Field label="Organization">{org?.name ?? "—"}</Field>
                <Field label="Target Sponsor Partner">{funder?.name ?? "—"}</Field>
                <Field label="Lokasi">{pengajuan.eventLocation || "—"}</Field>
                <Field label="Date">{formatEventDate(pengajuan.eventDate)}</Field>
                <Field label="Total budget">{formatRupiah(pengajuan.eventBudget)}</Field>
              </div>
              <div style={{ marginTop: 16 }}>
                <Field label="Description">{pengajuan.description || "—"}</Field>
              </div>
            </div>

            <div>
              <div className="sh-meta-label" style={{ marginBottom: 8 }}>
                Dokumen pendukung ({documents.length})
              </div>
              {documents.length === 0 ? (
                <p className="sh-muted">No documents yet.</p>
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
              <h2>Sponsorship Packages Offered</h2>
              {canReview && (
                <p className="sh-muted" style={{ margin: "4px 0 0" }}>
                  Choose the sponsorship package you want to fund from the options the organization offered.
                </p>
              )}
            </div>
          </header>
          <div className="sh-card__body">
            {packages.length === 0 ? (
              <p className="sh-muted">No packages yet.</p>
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
                setNoteErr(false);
                setAction("revisi");
              }}
              disabled={selectedPkg == null || busy}
              title={
                selectedPkg == null
                  ? "First pick the package to revise"
                  : "Request revision on the selected package"
              }
              style={selectedPkg == null ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
            >
              <MessageSquareWarning size={16} />
              Minta Revisi
            </button>
            <button
              className="sh-btn sh-btn--secondary"
              onClick={() => {
                setNote("");
                setNoteErr(false);
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
          title={preview.name || "Document preview"}
          width={760}
        >
          {preview.data === null ? (
            <p className="sh-muted">Loading document…</p>
          ) : preview.data ? (
            <PdfPreview dataUrl={preview.data} fileName={preview.name} />
          ) : (
            <p className="sh-muted">The document could not be loaded.</p>
          )}
        </Modal>
      )}

      {/* Catatan feedback / penolakan */}
      <Modal
        open={!!action}
        onClose={() => setAction(null)}
        title={action === "revisi" ? "Request revision" : "Reject submission"}
        footer={
          <>
            <button className="sh-btn sh-btn--secondary" onClick={() => setAction(null)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`sh-btn ${action === "revisi" ? "sh-btn--warning" : "sh-btn--danger"}`}
              onClick={confirmAction}
              disabled={busy}
            >
              {action === "revisi" ? "Send feedback" : "Reject submission"}
            </button>
          </>
        }
      >
        {action === "revisi" && revisedPkg && (
          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-md)",
              background: "var(--canvas-soft)",
              padding: 14,
              marginBottom: 14,
            }}
          >
            <div className="sh-row" style={{ gap: 8, marginBottom: 10 }}>
              <PackageIcon size={16} style={{ color: "var(--brand-500)" }} />
              <strong>Paket yang direvisi: {revisedPkg.name}</strong>
            </div>

            <div className="sh-row" style={{ gap: 24, flexWrap: "wrap", marginBottom: 10 }}>
              <div>
                <div className="sh-meta-label">Organization</div>
                <div className="sh-meta-value">{org?.name ?? "—"}</div>
              </div>
              <div>
                <div className="sh-meta-label">Event</div>
                <div className="sh-meta-value">{pengajuan.eventName}</div>
              </div>
              <div>
                <div className="sh-meta-label">Package value</div>
                <div className="sh-meta-value num">{formatRupiah(packageAmount(revisedPkg))}</div>
              </div>
            </div>

            <div className="sh-meta-label" style={{ marginBottom: 4 }}>
              Detail permintaan
            </div>
            <ul style={{ margin: "0 0 10px", paddingLeft: 18, fontSize: 13 }}>
              {revisedPkg.requests.length ? (
                revisedPkg.requests.map((r, i) => <li key={i}>{requestLabel(r)}</li>)
              ) : (
                <li className="sh-muted">—</li>
              )}
            </ul>

            <div className="sh-meta-label" style={{ marginBottom: 4 }}>
              Benefits for the sponsor partner
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {revisedPkg.benefits.length ? (
                revisedPkg.benefits.map((b, i) => <li key={i}>{b}</li>)
              ) : (
                <li className="sh-muted">—</li>
              )}
            </ul>
          </div>
        )}

        <div className={`sh-field${noteErr ? " sh-field--invalid" : ""}`}>
          <label className="sh-field__label">
            {action === "revisi" ? "Feedback for the organization" : "Alasan penolakan"}
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (noteErr) setNoteErr(false);
            }}
            placeholder={
              action === "revisi"
                ? "Write the feedback the organization needs to act on."
                : "Jelaskan alasan penolakan."
            }
          />
          {noteErr && (
            <div
              className="sh-row"
              style={{ gap: 6, marginTop: 6, color: "var(--status-failed)", fontSize: 13 }}
            >
              <AlertCircle size={14} style={{ flex: "none" }} />
              {action === "revisi"
                ? "Write what the organization needs to fix."
                : "Tulis alasan penolakan."}
            </div>
          )}
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
