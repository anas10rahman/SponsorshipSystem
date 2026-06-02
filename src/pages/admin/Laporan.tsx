import { useMemo } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Empty } from "@/components/Empty";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";
import { Banknote, FileText, ListChecks } from "lucide-react";

export default function AdminLaporan() {
  const { state } = useStore();

  const disalurkan = state.transactions
    .filter((t) => t.status === "disalurkan")
    .reduce((s, t) => s + t.amount, 0);

  const menunggu = state.transactions
    .filter((t) => t.status === "menunggu" || t.status === "diproses")
    .reduce((s, t) => s + t.amount, 0);

  // Top 5 proposal by raised
  const topProposals = useMemo(
    () =>
      [...state.proposals]
        .sort((a, b) => b.raised - a.raised)
        .slice(0, 5),
    [state.proposals],
  );

  // Top funders by total commitment (sum of all their disalurkan + menunggu tx)
  const topFunders = useMemo(() => {
    const totals = new Map<string, number>();
    for (const tx of state.transactions) {
      if (tx.status === "ditolak") continue;
      totals.set(tx.funderId, (totals.get(tx.funderId) ?? 0) + tx.amount);
    }
    return state.funders
      .map((f) => ({ funder: f, total: totals.get(f.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [state.transactions, state.funders]);

  const exportCsv = () => {
    const rows = state.transactions.map((t) => {
      const prop = state.proposals.find((p) => p.id === t.proposalId);
      const org = state.organizations.find((o) => o.id === t.orgId);
      const f = state.funders.find((x) => x.id === t.funderId);
      return [
        t.id,
        prop?.title ?? "",
        org?.name ?? "",
        f?.name ?? "",
        t.amount,
        t.status,
        t.createdAt,
        t.verifiedAt ?? "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",");
    });
    const header = "id,proposal,organisasi,pendana,nominal,status,dibuat,diverifikasi";
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transaksi-sponsorhub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Topbar title="Laporan" />
      <div className="sh-shell__content">
        <PageHead
          title="Laporan"
          subtitle="Ringkasan keuangan, top proposal, dan top pendana."
          actions={
            <button className="sh-btn sh-btn--secondary" onClick={exportCsv}>
              Ekspor CSV
            </button>
          }
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disalurkan"
            value={formatRupiah(disalurkan)}
            icon={<Banknote size={20} />}
          />
          <StatCard
            label="Dana tertahan (escrow)"
            value={formatRupiah(menunggu)}
            icon={<ListChecks size={20} />}
          />
          <StatCard
            label="Proposal aktif"
            value={state.proposals.filter((p) => p.status === "aktif").length}
            icon={<FileText size={20} />}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Top proposal (terkumpul)</h2>
            </header>
            {topProposals.length === 0 ? (
              <Empty title="Belum ada data" />
            ) : (
              <div style={{ padding: 8 }}>
                {topProposals.map((p) => {
                  const org = state.organizations.find((o) => o.id === p.orgId);
                  const pct = percent(p.raised, p.target);
                  return (
                    <div key={p.id} style={{ padding: 12 }}>
                      <div className="sh-row sh-row--between" style={{ marginBottom: 6 }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{p.title}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {org?.name}
                          </div>
                        </div>
                        <div className="num" style={{ fontWeight: 700 }}>
                          {formatRupiah(p.raised)}
                        </div>
                      </div>
                      <div className="sh-progress">
                        <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Top pendana (komitmen)</h2>
            </header>
            {topFunders.length === 0 ? (
              <Empty title="Belum ada data" />
            ) : (
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Pendana</th>
                      <th>Total komitmen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFunders.map(({ funder, total }) => (
                      <tr key={funder.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{funder.name}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {funder.type}
                          </div>
                        </td>
                        <td className="num">{formatRupiah(total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
