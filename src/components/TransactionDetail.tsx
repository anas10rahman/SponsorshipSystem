import { Modal } from "./Modal";
import { StatusBadge } from "./StatusBadge";
import { useStore } from "@/lib/store";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import type { ReactNode } from "react";

type Props = {
  tx: Transaction | null;
  onClose: () => void;
  actions?: ReactNode;
};

/** Modal detail transaksi — dipakai Admin, Organisasi, Pendana.
 *  `actions` diberikan dari parent (verifikasi / reject / dst). */
export function TransactionDetail({ tx, onClose, actions }: Props) {
  const { state } = useStore();
  if (!tx) return null;

  const proposal = state.proposals.find((p) => p.id === tx.proposalId);
  const org = state.organizations.find((o) => o.id === tx.orgId);
  const funder = state.funders.find((f) => f.id === tx.funderId);
  const verifier = state.users.find((u) => u.id === tx.verifiedBy);

  // Audit log entries scoped to this transaksi
  const logs = state.auditLogs.filter((l) => l.entityId === tx.id);

  return (
    <Modal open onClose={onClose} title={`Transaksi ${tx.id}`} footer={actions} width={680}>
      <div className="sh-row sh-row--between" style={{ marginBottom: 4 }}>
        <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-500)" }}>
          {tx.id}
        </code>
        <StatusBadge kind="tx" status={tx.status} />
      </div>

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
        <Field label="Nominal">
          <strong className="num">{formatRupiah(tx.amount)}</strong>
        </Field>
        <Field label="Tanggal dibuat">{formatDate(tx.createdAt)}</Field>

        <Field label="Proposal">{proposal?.title ?? "—"}</Field>
        <Field label="Kategori">{proposal?.category ?? "—"}</Field>

        <Field label="Organisasi">{org?.name ?? "—"}</Field>
        <Field label="Pendana">{funder?.name ?? "—"}</Field>

        {tx.verifiedAt && (
          <>
            <Field label="Diverifikasi oleh">{verifier?.name ?? tx.verifiedBy}</Field>
            <Field label="Waktu verifikasi">{formatDateTime(tx.verifiedAt)}</Field>
          </>
        )}
        {tx.note && (
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Catatan admin">{tx.note}</Field>
          </div>
        )}
      </div>

      {logs.length > 0 && (
        <div>
          <h4 style={{ marginBottom: 12 }}>Audit log</h4>
          <div className="sh-timeline">
            {logs.map((log) => {
              const actor = state.users.find((u) => u.id === log.actorId);
              return (
                <div key={log.id} className="sh-timeline__item">
                  <div className="sh-timeline__action">{log.action}</div>
                  <div className="sh-timeline__actor">oleh {actor?.name ?? log.actorId}</div>
                  <div className="sh-timeline__time">{formatDateTime(log.createdAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
