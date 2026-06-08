import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { Modal } from "@/components/Modal";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge } from "@/lib/pengajuan";
import type { Pengajuan, PengajuanStatus } from "@/lib/types";
import { CheckCircle2, XCircle, MessageSquareWarning, Eye } from "lucide-react";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "diajukan", label: "Perlu ditinjau" },
  { value: "perlu_revisi", label: "Diberi feedback" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

export default function FunderPengajuanInbox() {
  const { state, currentUser } = useStore();
  const { approvePengajuan, rejectPengajuan, requestRevisionPengajuan } = useActions();
  const toast = useToast();
  const funderId = currentUser?.funderId ?? "";

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("diajukan");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // revision/reject modal
  const [actionModal, setActionModal] = useState<{ kind: "revisi" | "tolak"; id: string } | null>(
    null,
  );
  const [note, setNote] = useState("");

  const inbox = useMemo(
    () => state.pengajuan.filter((p) => p.funderId === funderId && p.status !== "draf"),
    [state.pengajuan, funderId],
  );
  const rows = filter === "semua" ? inbox : inbox.filter((p) => p.status === filter);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: inbox.length };
    for (const s of ["diajukan", "perlu_revisi", "disetujui", "ditolak"] as const) {
      c[s] = inbox.filter((p) => p.status === s).length;
    }
    return c;
  }, [inbox]);

  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  const doApprove = (p: Pengajuan) => {
    approvePengajuan(p.id);
    toast.success(`Pengajuan "${p.eventName}" disetujui.`);
    setSelectedId(null);
  };

  const openAction = (kind: "revisi" | "tolak", id: string) => {
    setNote("");
    setActionModal({ kind, id });
  };

  const confirmAction = () => {
    if (!actionModal) return;
    if (!note.trim()) {
      toast.failed("Tulis catatan dulu untuk organisasi.");
      return;
    }
    const p = state.pengajuan.find((x) => x.id === actionModal.id);
    if (actionModal.kind === "revisi") {
      requestRevisionPengajuan(actionModal.id, note.trim());
      toast.info(`Feedback dikirim untuk "${p?.eventName ?? ""}".`);
    } else {
      rejectPengajuan(actionModal.id, note.trim());
      toast.failed(`Pengajuan "${p?.eventName ?? ""}" ditolak.`);
    }
    setActionModal(null);
    setSelectedId(null);
  };

  const reviewActions = (p: Pengajuan) =>
    p.status === "diajukan" || p.status === "perlu_revisi" ? (
      <>
        <button className="sh-btn sh-btn--secondary" onClick={() => openAction("tolak", p.id)}>
          <XCircle size={16} />
          Tolak
        </button>
        <button className="sh-btn sh-btn--warning" onClick={() => openAction("revisi", p.id)}>
          <MessageSquareWarning size={16} />
          Berikan feedback
        </button>
        <button className="sh-btn sh-btn--primary" onClick={() => doApprove(p)}>
          <CheckCircle2 size={16} />
          Setujui
        </button>
      </>
    ) : null;

  return (
    <>
      <Topbar title="Pengajuan masuk" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengajuan masuk"
          subtitle="Tinjau pengajuan sponsorship dari organisasi. Persetujuan Anda bersifat final."
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

        {rows.length === 0 ? (
          <Empty
            title="Tidak ada pengajuan"
            description="Pengajuan dari organisasi akan muncul di sini."
          />
        ) : (
          <section className="sh-card">
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Organisasi</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const org = state.organizations.find((o) => o.id === p.orgId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.eventName}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {p.eventLocation}
                          </div>
                        </td>
                        <td>
                          {org ? (
                            <Link to={`/funder/organisasi/${org.id}`}>{org.name}</Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{p.type === "in_cash" ? "In-Cash" : "In-Kind"}</td>
                        <td className="num">
                          {p.type === "in_cash"
                            ? formatRupiah(p.requestedAmount ?? 0)
                            : `${(p.inKindItems ?? []).length} barang`}
                        </td>
                        <td>
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td className="sh-muted">{formatDate(p.updatedAt)}</td>
                        <td>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => setSelectedId(p.id)}
                          >
                            <Eye size={14} />
                            Tinjau
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <PengajuanDetail
        pengajuan={selected}
        onClose={() => setSelectedId(null)}
        actions={selected ? reviewActions(selected) : null}
      />

      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={actionModal?.kind === "revisi" ? "Berikan feedback" : "Tolak pengajuan"}
        footer={
          <>
            <button className="sh-btn sh-btn--secondary" onClick={() => setActionModal(null)}>
              Batal
            </button>
            <button
              className={`sh-btn ${actionModal?.kind === "revisi" ? "sh-btn--warning" : "sh-btn--danger"}`}
              onClick={confirmAction}
            >
              {actionModal?.kind === "revisi" ? "Kirim feedback" : "Tolak pengajuan"}
            </button>
          </>
        }
      >
        <div className="sh-field">
          <label className="sh-field__label">
            {actionModal?.kind === "revisi"
              ? "Feedback untuk organisasi"
              : "Alasan penolakan"}
          </label>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              actionModal?.kind === "revisi"
                ? "Tulis masukan/feedback yang perlu diperbaiki organisasi."
                : "Jelaskan alasan penolakan."
            }
          />
        </div>
      </Modal>
    </>
  );
}
