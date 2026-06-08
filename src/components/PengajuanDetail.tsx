import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { PdfPreview } from "./PdfPreview";
import { useStore } from "@/lib/store";
import { formatDateTime, formatEventDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge } from "@/lib/pengajuan";
import type { Pengajuan } from "@/lib/types";

type Props = {
  pengajuan: Pengajuan | null;
  onClose: () => void;
  actions?: ReactNode;
};

export function PengajuanDetail({ pengajuan, onClose, actions }: Props) {
  const { state } = useStore();
  if (!pengajuan) return null;

  const org = state.organizations.find((o) => o.id === pengajuan.orgId);
  const funder = state.funders.find((f) => f.id === pengajuan.funderId);
  const badge = pengajuanBadge(pengajuan.status);

  return (
    <Modal
      open
      onClose={onClose}
      title={pengajuan.eventName || "Detail pengajuan"}
      footer={actions}
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
        <Field label="Jenis">
          {pengajuan.type === "in_cash" ? "In-Cash (uang)" : "In-Kind (barang)"}
        </Field>
        {pengajuan.type === "in_cash" ? (
          <Field label="Nominal diajukan">
            <strong className="num">{formatRupiah(pengajuan.requestedAmount ?? 0)}</strong>
          </Field>
        ) : (
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="sh-meta-label">Barang yang diminta</div>
            <ul style={{ margin: "6px 0 0 18px" }}>
              {(pengajuan.inKindItems ?? [])
                .filter((it) => it.name.trim())
                .map((it, i) => (
                  <li key={i}>
                    {it.name} — {it.qty} {it.unit}
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Deskripsi">{pengajuan.description || "—"}</Field>
        </div>
        {pengajuan.benefits.length > 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="sh-meta-label">Benefit untuk pendana</div>
            <ul style={{ margin: "6px 0 0 18px" }}>
              {pengajuan.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Dokumen proposal + preview */}
      <div>
        <h4 style={{ marginBottom: 12 }}>Dokumen proposal</h4>
        {pengajuan.proposalDocData ? (
          <PdfPreview
            dataUrl={pengajuan.proposalDocData}
            fileName={pengajuan.proposalDocUrl}
          />
        ) : pengajuan.proposalDocUrl ? (
          <div className="sh-notice sh-notice--info">
            {pengajuan.proposalDocUrl} — preview tidak tersedia untuk dokumen ini.
          </div>
        ) : (
          <p className="sh-muted">Belum ada dokumen.</p>
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
