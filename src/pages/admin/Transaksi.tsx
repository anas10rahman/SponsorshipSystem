import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionDetail } from "@/components/TransactionDetail";
import { useActions, useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatDate, formatRupiah } from "@/lib/format";
import type { Transaction, TransactionStatus } from "@/lib/types";
import { CheckCircle2, XCircle, Eye, PlayCircle } from "lucide-react";

const FILTERS: Array<{ value: "semua" | TransactionStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "menunggu", label: "Menunggu" },
  { value: "diproses", label: "Diproses" },
  { value: "disalurkan", label: "Disalurkan" },
  { value: "ditolak", label: "Ditolak" },
];

export default function AdminTransaksi() {
  const { state } = useStore();
  const { verifyTransaction, rejectTransaction, processTransaction } = useActions();
  const toast = useToast();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: state.transactions.length };
    for (const s of ["menunggu", "diproses", "disalurkan", "ditolak"] as const) {
      c[s] = state.transactions.filter((t) => t.status === s).length;
    }
    return c;
  }, [state.transactions]);

  const rows: Transaction[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.transactions.filter((t) => {
      if (filter !== "semua" && t.status !== filter) return false;
      if (!q) return true;
      const proposal = state.proposals.find((p) => p.id === t.proposalId);
      const org = state.organizations.find((o) => o.id === t.orgId);
      const funder = state.funders.find((f) => f.id === t.funderId);
      return [
        t.id,
        proposal?.title,
        org?.name,
        funder?.name,
        String(t.amount),
      ]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    });
  }, [state.transactions, state.proposals, state.organizations, state.funders, filter, search]);

  const selected = state.transactions.find((t) => t.id === selectedId) ?? null;

  const handleVerify = (tx: Transaction) => {
    verifyTransaction(tx.id);
    toast.success(`Transaksi ${tx.id} disalurkan & dicatat di audit log.`);
    setSelectedId(null);
  };

  const handleReject = (tx: Transaction) => {
    if (!window.confirm(`Tolak transaksi ${tx.id}? Tindakan ini akan dicatat di audit log.`)) {
      return;
    }
    rejectTransaction(tx.id);
    toast.failed(`Transaksi ${tx.id} ditolak.`);
    setSelectedId(null);
  };

  const handleProcess = (tx: Transaction) => {
    processTransaction(tx.id);
    toast.info(`Transaksi ${tx.id} sekarang sedang diproses.`);
  };

  return (
    <>
      <Topbar
        title="Transaksi"
        search={{ value: search, onChange: setSearch, placeholder: "Cari ID, organisasi, pendana…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Transaksi"
          subtitle="Verifikasi & pantau status setiap transaksi. Hanya Admin yang dapat mengubah ke disalurkan atau ditolak."
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
            <Empty
              title="Tidak ada transaksi"
              description="Coba ganti filter atau kata kunci pencarian."
            />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proposal</th>
                    <th>Organisasi</th>
                    <th>Pendana</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th style={{ width: 200 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const proposal = state.proposals.find((p) => p.id === t.proposalId);
                    const org = state.organizations.find((o) => o.id === t.orgId);
                    const funder = state.funders.find((f) => f.id === t.funderId);
                    return (
                      <tr key={t.id}>
                        <td>
                          <code
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              color: "var(--ink-700)",
                            }}
                          >
                            {t.id}
                          </code>
                        </td>
                        <td>{proposal?.title ?? "—"}</td>
                        <td>{org?.name ?? "—"}</td>
                        <td>{funder?.name ?? "—"}</td>
                        <td className="num">{formatRupiah(t.amount)}</td>
                        <td>
                          <StatusBadge kind="tx" status={t.status} />
                        </td>
                        <td className="sh-muted">{formatDate(t.createdAt)}</td>
                        <td>
                          <div className="sh-row" style={{ gap: 6 }}>
                            <button
                              className="sh-btn sh-btn--ghost sh-btn--sm"
                              onClick={() => setSelectedId(t.id)}
                              title="Detail"
                            >
                              <Eye size={14} />
                              Detail
                            </button>
                            {t.status === "menunggu" && (
                              <button
                                className="sh-btn sh-btn--ghost sh-btn--sm"
                                onClick={() => handleProcess(t)}
                                title="Tandai sedang diproses"
                              >
                                <PlayCircle size={14} />
                              </button>
                            )}
                            {(t.status === "menunggu" || t.status === "diproses") && (
                              <button
                                className="sh-btn sh-btn--primary sh-btn--sm"
                                onClick={() => handleVerify(t)}
                                title="Verifikasi & salurkan"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            {t.status === "menunggu" && (
                              <button
                                className="sh-btn sh-btn--danger sh-btn--sm"
                                onClick={() => handleReject(t)}
                                title="Tolak"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
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

      <TransactionDetail
        tx={selected}
        onClose={() => setSelectedId(null)}
        actions={
          selected && (
            <>
              {selected.status === "menunggu" && (
                <button
                  className="sh-btn sh-btn--secondary"
                  onClick={() => handleReject(selected)}
                >
                  <XCircle size={16} />
                  Tolak
                </button>
              )}
              {(selected.status === "menunggu" || selected.status === "diproses") && (
                <button
                  className="sh-btn sh-btn--primary"
                  onClick={() => handleVerify(selected)}
                >
                  <CheckCircle2 size={16} />
                  Verifikasi & salurkan
                </button>
              )}
            </>
          )
        }
      />
    </>
  );
}
