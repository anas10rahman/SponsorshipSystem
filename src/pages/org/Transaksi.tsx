import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { TransactionDetail } from "@/components/TransactionDetail";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/format";

export default function OrgTransaksi() {
  const { state, currentUser } = useStore();
  const orgId = currentUser?.orgId ?? "";
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.transactions
      .filter((t) => t.orgId === orgId)
      .filter((t) => {
        if (!q) return true;
        const prop = state.proposals.find((p) => p.id === t.proposalId);
        const f = state.funders.find((x) => x.id === t.funderId);
        return [t.id, prop?.title, f?.name].some((s) =>
          String(s ?? "").toLowerCase().includes(q),
        );
      });
  }, [state.transactions, state.proposals, state.funders, orgId, search]);

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
          subtitle="Pantau transaksi pendanaan yang masuk ke proposal Anda."
        />

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty
              title="Belum ada transaksi"
              description="Transaksi akan muncul setelah ada pendana menyalurkan dana ke proposal Anda."
            />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Proposal</th>
                    <th>Pendana</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => {
                    const prop = state.proposals.find((p) => p.id === t.proposalId);
                    const f = state.funders.find((x) => x.id === t.funderId);
                    return (
                      <tr key={t.id}>
                        <td>
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {t.id}
                          </code>
                        </td>
                        <td>{prop?.title ?? "—"}</td>
                        <td>{f?.name ?? "—"}</td>
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
