import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { PdfPreview } from "@/components/PdfPreview";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { selectedAmount } from "@/lib/pengajuan";
import { orgVerifyBadge } from "@/lib/orgVerify";
import type { OrgVerificationStatus } from "@/lib/types";
import { CheckCircle2, XCircle, FileText, Eye, ShieldCheck } from "lucide-react";

type Filter = "semua" | "menunggu" | "terverifikasi" | "ditolak" | "belum_diajukan";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "semua", label: "All" },
  { value: "menunggu", label: "Pending" },
  { value: "terverifikasi", label: "Verified" },
  { value: "ditolak", label: "Rejected" },
  { value: "belum_diajukan", label: "Not requested" },
];

export default function AdminOrganisasi() {
  const { state } = useStore();
  const { verifyOrg, rejectOrg } = useActions();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [noteErr, setNoteErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ title: string; data: string | null } | null>(null);

  const openPreview = async (orgId: string, kind: "compro" | "ktp", title: string) => {
    setPreview({ title, data: null });
    const d = await api.orgDoc(orgId, kind).catch(() => null);
    setPreview({ title, data: d ?? "" });
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: state.organizations.length };
    for (const s of ["menunggu", "terverifikasi", "ditolak", "belum_diajukan"])
      c[s] = state.organizations.filter((o) => o.verificationStatus === s).length;
    return c;
  }, [state.organizations]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.organizations.filter((o) => {
      if (filter !== "semua" && o.verificationStatus !== filter) return false;
      if (!q) return true;
      return [o.name, o.category, o.city].some((s) => s.toLowerCase().includes(q));
    });
  }, [state.organizations, search, filter]);

  const review = state.organizations.find((o) => o.id === reviewId) ?? null;

  const closeReview = () => {
    setReviewId(null);
    setRejecting(false);
    setNote("");
  };

  const doVerify = async () => {
    if (!review) return;
    setBusy(true);
    try {
      await verifyOrg(review.id);
      toast.success(`Organization "${review.name}" verified.`);
      closeReview();
    } catch (e: any) {
      toast.failed(String(e?.message || "Verification failed."));
    } finally {
      setBusy(false);
    }
  };

  const doReject = async () => {
    if (!review) return;
    if (!note.trim()) {
      setNoteErr(true);
      return;
    }
    setBusy(true);
    try {
      await rejectOrg(review.id, note.trim());
      toast.failed(`Verification for "${review.name}" rejected.`);
      closeReview();
    } catch (e: any) {
      toast.failed(String(e?.message || "Could not reject."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Topbar
        search={{ value: search, onChange: setSearch, placeholder: "Search organizations…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Organization directory"
          subtitle="Review and verify organizations. Only verified organizations can send submissions."
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="sh-muted" style={{ fontWeight: 600 }}>
                ({counts[f.value] ?? 0})
              </span>
            </button>
          ))}
        </div>

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="No organizations" description="Try changing the filters." />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Organization</th>
                    <th>Category</th>
                    <th>City</th>
                    <th>Verification status</th>
                    <th>Submission sent</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((org) => {
                    const myPengajuan = state.pengajuan.filter((p) => p.orgId === org.id);
                    const sent = myPengajuan.filter((p) => p.status !== "draf").length;
                    const badge = orgVerifyBadge(org.verificationStatus);
                    return (
                      <tr key={org.id}>
                        <td data-label="Organization">
                          <div className="sh-row" style={{ gap: 10 }}>
                            <span className="sh-org-logo">{org.logoInitials}</span>
                            <Link
                              to={`/admin/organisasi/${org.id}`}
                              style={{ fontWeight: 700, color: "inherit" }}
                            >
                              {org.name}
                            </Link>
                          </div>
                        </td>
                        <td data-label="Category">{org.category}</td>
                        <td data-label="City">{org.city}</td>
                        <td data-label="Verification status">
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td data-label="Submission sent">{sent}</td>
                        <td data-label="Aksi">
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => {
                              setNote("");
                              setRejecting(false);
                              setReviewId(org.id);
                            }}
                          >
                            <ShieldCheck size={14} />
                            Tinjau
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {review && (
        <Modal
          open
          onClose={closeReview}
          title={`Verification: ${review.name}`}
          width={640}
          footer={
            review.verificationStatus === "terverifikasi" ? (
              <span className="sh-muted">This organization is already verified.</span>
            ) : rejecting ? (
              <>
                <button className="sh-btn sh-btn--secondary" onClick={() => setRejecting(false)} disabled={busy}>
                  Cancel
                </button>
                <button className="sh-btn sh-btn--danger" onClick={doReject} disabled={busy}>
                  Send rejection
                </button>
              </>
            ) : (
              <>
                <button
                  className="sh-btn sh-btn--secondary"
                  onClick={() => setRejecting(true)}
                  disabled={busy}
                >
                  <XCircle size={16} />
                  Tolak
                </button>
                <button className="sh-btn sh-btn--primary" onClick={doVerify} disabled={busy}>
                  <CheckCircle2 size={16} />
                  Verifikasi
                </button>
              </>
            )
          }
        >
          <div className="sh-row sh-row--between" style={{ marginBottom: 12 }}>
            <StatusBadge
              kind="custom"
              label={orgVerifyBadge(review.verificationStatus).label}
              variant={orgVerifyBadge(review.verificationStatus).variant}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              padding: "12px 0",
              borderTop: "1px solid var(--line)",
            }}
          >
            <Field label="Category">{review.category || "—"}</Field>
            <Field label="City">{review.city || "—"}</Field>
            <Field label="Email">{review.email || "—"}</Field>
            <Field label="Payout account">{review.payoutAccount || "—"}</Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Description">{review.description || "—"}</Field>
            </div>
          </div>

          <h4 style={{ margin: "6px 0 8px" }}>Penanggung jawab (PIC)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Name">{review.pic.name || "—"}</Field>
            <Field label="Role">{review.pic.position || "—"}</Field>
            <Field label="No. WA">{review.pic.phone || "—"}</Field>
            <Field label="PIC email">{review.pic.email || "—"}</Field>
          </div>

          <h4 style={{ margin: "14px 0 8px" }}>Documents</h4>
          <DocRow
            label="Company profile"
            name={review.comproUrl ?? ""}
            onPreview={() => openPreview(review.id, "compro", review.comproUrl ?? "Company profile")}
          />
          <DocRow
            label="KTP/KTM PIC"
            name={review.pic.idDocUrl}
            onPreview={() => openPreview(review.id, "ktp", review.pic.idDocUrl || "KTP/KTM")}
          />

          {review.verificationStatus === "ditolak" && review.verificationNote && (
            <div className="sh-notice sh-notice--failed" style={{ marginTop: 12 }}>
              Ditolak sebelumnya: {review.verificationNote}
            </div>
          )}

          {rejecting && (
            <div
              className={`sh-field${noteErr ? " sh-field--invalid" : ""}`}
              style={{ marginTop: 12 }}
            >
              <label className="sh-field__label">Alasan penolakan</label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (noteErr) setNoteErr(false);
                }}
                placeholder="Explain what the organization needs to fix."
              />
              {noteErr && (
                <span className="sh-field__hint" style={{ color: "var(--status-failed)" }}>
                  A rejection reason is required.
                </span>
              )}
            </div>
          )}
        </Modal>
      )}

      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title={preview.title || "Document preview"}
          width={760}
        >
          {preview.data === null ? (
            <p className="sh-muted">Loading document…</p>
          ) : preview.data ? (
            <PdfPreview dataUrl={preview.data} fileName={preview.title} />
          ) : (
            <p className="sh-muted">The document could not be loaded.</p>
          )}
        </Modal>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="sh-meta-label">{label}</div>
      <div className="sh-meta-value">{children}</div>
    </div>
  );
}

function DocRow({
  label,
  name,
  onPreview,
}: {
  label: string;
  name: string;
  onPreview?: () => void;
}) {
  return (
    <div
      className="sh-row sh-row--between"
      style={{ gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}
    >
      <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
        <div className="sh-meta-label" style={{ width: 120, flex: "none" }}>
          {label}
        </div>
        {name ? (
          <div className="sh-row" style={{ gap: 8, minWidth: 0 }}>
            <FileText size={16} style={{ color: "var(--status-failed)", flex: "none" }} />
            <span style={{ wordBreak: "break-all" }}>{name}</span>
          </div>
        ) : (
          <span className="sh-muted">Not uploaded</span>
        )}
      </div>
      {name && onPreview && (
        <button className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onPreview} style={{ flex: "none" }}>
          <Eye size={14} />
          Pratinjau
        </button>
      )}
    </div>
  );
}
