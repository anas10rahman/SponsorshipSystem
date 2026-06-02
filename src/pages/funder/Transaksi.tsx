import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionDetail } from "@/components/TransactionDetail";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/format";
import type { TransactionStatus } from "@/lib/types";

const FILTERS: Array<{ value: "semua" | TransactionStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "menunggu", label: "Menunggu" },
  { value: "diproses", label: "Diproses" },
  { value: "disalurkan", label: "Disalurkan" },
  { value: "ditolak", label: "Ditolak" },
];

export default function FunderTransaksi() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.transactions
      .filter((t) => t.funderId === funderId)
      .filter((t) => (filter === "semua" ? true : t.status === filter))
      .filter((t) => {
        if (!q) return true;
        const prop = state.proposals.find((p) => p.id === t.proposalId);
        const org = state.organizations.find((o) => o.id === t.orgId);
        return [t.id, prop?.title, org?.name].some((s) =>
          String(s ?? "").toLowerCase().includes(q),
        );
      });
  }, [state.transactions, state.proposals, state.organizations, funderId, filter, search]);

  const selected = state.transactions.find((t) => t.id === selectedId) ?? null;

  return (
    <>
      <Topbar
        title="Riwayat transaksi"
        search={{ value: search, onChange: setSearch, placeholder: "Cari transaksi…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Riwayat transaksi"
          subtitle="Daftar penyaluran dana Anda ke setiap proposal."
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="Belum ada transaksi" />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proposal</th>
                    <th>Organisasi</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const prop = state.proposals.find((p) => p.id === t.proposalId);
                    const org = state.organizations.find((o) => o.id === t.orgId);
                    return (
                      <tr key={t.id}>
                        <td>
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {t.id}
                          </code>
                        </td>
                        <td>{prop?.title ?? "—"}</td>
                        <td>{org?.name ?? "—"}</td>
                        <td className="num">{formatRupiah(t.amount)}</td>
                        <td>
                          <StatusBadge kind="tx" status={t.status} />
                        </td>
                        <td className="sh-muted">{formatDate(t.createdAt)}</td>
                        <td>
                          <button
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                            onClick={() => setSelectedId(t.id)}
                          >
                            Detail
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

      <TransactionDetail tx={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
