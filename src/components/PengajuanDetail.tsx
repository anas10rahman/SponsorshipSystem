import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { PdfPreview } from "./PdfPreview";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { formatDateTime, formatEventDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge, packageAmount, requestLabel } from "@/lib/pengajuan";
import type { Pengajuan, SponsorshipPackage } from "@/lib/types";
import { CheckCircle2, XCircle, MessageSquareWarning, Wallet, FileText, Eye } from "lucide-react";

/** Aksi tinjauan pendana. Bila diisi, paket jadi bisa dipilih (radio)
 *  dan footer menampilkan tombol Setujui Pendanaan. */
export type PengajuanReview = {
  onApprove: (packageIndex: number) => void;
  onReject: () => void;
  onFeedback: () => void;
};

type Props = {
  pengajuan: Pengajuan | null;
  onClose: () => void;
  actions?: ReactNode;
  review?: PengajuanReview;
};

export function PengajuanDetail({ pengajuan, onClose, actions, review }: Props) {
  if (!pengajuan) return null;
  return (
    <PengajuanDetailInner
      pengajuan={pengajuan}
      onClose={onClose}
      actions={actions}
      review={review}
    />
  );
}

function PengajuanDetailInner({
  pengajuan,
  onClose,
  actions,
  review,
}: {
  pengajuan: Pengajuan;
  onClose: () => void;
  actions?: ReactNode;
  review?: PengajuanReview;
}) {
  const { state } = useStore();
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const documents = pengajuan.documents ?? [];
  // Pratinjau dokumen (lazy per index): { index, name, data|null(loading) }
  const [preview, setPreview] = useState<{ index: number; name: string; data: string | null } | null>(
    null,
  );

  const openPreview = (index: number, name: string) => {
    setPreview({ index, name, data: null });
    api
      .pengajuanDoc(pengajuan.id, index)
      .then((d) => setPreview((cur) => (cur && cur.index === index ? { ...cur, data: d } : cur)))
      .catch(() => setPreview((cur) => (cur && cur.index === index ? { ...cur, data: "" } : cur)));
  };

  const org = state.organizations.find((o) => o.id === pengajuan.orgId);
  const funder = state.funders.find((f) => f.id === pengajuan.funderId);
  const badge = pengajuanBadge(pengajuan.status);
  const packages = pengajuan.packages ?? [];

  // Mode pilih paket aktif hanya saat pendana boleh meninjau.
  const selectable = !!review;
  const chosenIdx = selectable ? selectedPkg : pengajuan.selectedPackage ?? null;
  const chosen = chosenIdx != null ? packages[chosenIdx] : undefined;

  const footer = selectable ? (
    <>
      <button className="sh-btn sh-btn--secondary" onClick={review!.onReject}>
        <XCircle size={16} />
        Tolak
      </button>
      <button className="sh-btn sh-btn--warning" onClick={review!.onFeedback}>
        <MessageSquareWarning size={16} />
        Berikan feedback
      </button>
      <button
        className="sh-btn sh-btn--primary"
        disabled={selectedPkg == null}
        style={selectedPkg == null ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
        onClick={() => selectedPkg != null && review!.onApprove(selectedPkg)}
      >
        <CheckCircle2 size={16} />
        Setujui Pendanaan
      </button>
    </>
  ) : (
    actions
  );

  return (
    <>
    <Modal
      open
      onClose={onClose}
      title={pengajuan.eventName || "Detail pengajuan"}
      footer={footer}
      width={720}
    >
      <div className="sh-row sh-row--between">
        <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-500)" }}>
          {pengajuan.id}
        </code>
        <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
      </div>

      {pengajuan.status === "perlu_revisi" && pengajuan.revisionNote && (
        <div className="sh-notice">
          <strong>Feedback dari pendana:</strong> {pengajuan.revisionNote}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          padding: "12px 0",
          borderTop: "1px solid var(--line)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <Field label="Organisasi">{org?.name ?? "—"}</Field>
        <Field label="Pendana tujuan">{funder?.name ?? "—"}</Field>
        <Field label="Lokasi">{pengajuan.eventLocation || "—"}</Field>
        <Field label="Tanggal">{formatEventDate(pengajuan.eventDate)}</Field>
        <Field label="Total anggaran">{formatRupiah(pengajuan.eventBudget)}</Field>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Deskripsi">{pengajuan.description || "—"}</Field>
        </div>
      </div>

      {/* Paket sponsorship */}
      <div>
        <h4 style={{ marginBottom: 4 }}>Paket sponsorship</h4>
        {selectable && (
          <p className="sh-muted" style={{ marginTop: 0, marginBottom: 12 }}>
            Pilih satu paket yang ingin Anda danai, lalu setujui.
          </p>
        )}
        {packages.length === 0 ? (
          <p className="sh-muted">Belum ada paket.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {packages.map((pk, i) => (
              <PackageCard
                key={i}
                pkg={pk}
                index={i}
                selectable={selectable}
                selected={chosenIdx === i}
                approvedChoice={!selectable && pengajuan.selectedPackage === i}
                onSelect={() => selectable && setSelectedPkg(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Ringkasan pilihan (mode tinjau) */}
      {selectable && (
        <div
          className="sh-row sh-row--between"
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--canvas-tint)",
          }}
        >
          <div className="sh-row" style={{ gap: 10 }}>
            <Wallet size={18} style={{ color: "var(--brand-500)" }} />
            <div>
              <div className="sh-meta-label">Paket terpilih</div>
              <strong>{chosen?.name ?? "Belum dipilih"}</strong>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="sh-meta-label">Total pendanaan</div>
            <strong className="num" style={{ color: "var(--brand-600)" }}>
              {formatRupiah(chosen ? packageAmount(chosen) : 0)}
            </strong>
          </div>
        </div>
      )}

      {/* Dokumen pendukung — daftar + pratinjau (icon mata) */}
      <div>
        <h4 style={{ marginBottom: 12 }}>Dokumen pendukung ({documents.length})</h4>
        {documents.length === 0 ? (
          <p className="sh-muted">Belum ada dokumen.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {documents.map((doc, i) => (
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

      <div>
        <h4 style={{ marginBottom: 12 }}>Riwayat status</h4>
        <div className="sh-timeline">
          {pengajuan.history.map((h, i) => (
            <div key={i} className="sh-timeline__item">
              <div className="sh-timeline__action">{h.action}</div>
              <div className="sh-timeline__actor">oleh {h.actor}</div>
              <div className="sh-timeline__time">{formatDateTime(h.at)}</div>
              {h.note && <div className="sh-timeline__note">{h.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </Modal>

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
    </>
  );
}

function PackageCard({
  pkg,
  index,
  selectable,
  selected,
  approvedChoice,
  onSelect,
}: {
  pkg: SponsorshipPackage;
  index: number;
  selectable: boolean;
  selected: boolean;
  approvedChoice: boolean;
  onSelect: () => void;
}) {
  const active = selected || approvedChoice;
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      style={{
        border: `1px solid ${active ? "var(--brand-500)" : "var(--line)"}`,
        outline: active ? "1px solid var(--brand-500)" : "none",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        cursor: selectable ? "pointer" : "default",
        background: active ? "var(--brand-50, var(--canvas-tint))" : "var(--canvas)",
      }}
    >
      <div className="sh-row sh-row--between" style={{ marginBottom: 10 }}>
        <div className="sh-row" style={{ gap: 10 }}>
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
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "var(--brand-500)",
                  }}
                />
              )}
            </span>
          )}
          <strong>{pkg.name || `Paket ${index + 1}`}</strong>
          {approvedChoice && (
            <StatusBadge kind="custom" label="Dipilih pendana" variant="success" />
          )}
        </div>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="sh-meta-label">{label}</div>
      <div className="sh-meta-value">{children}</div>
    </div>
  );
}
