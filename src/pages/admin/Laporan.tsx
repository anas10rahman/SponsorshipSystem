import { useMemo } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Empty } from "@/components/Empty";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { Banknote, Clock, CheckCircle2 } from "lucide-react";

export default function AdminLaporan() {
  const { state } = useStore();

  const approved = state.pengajuan.filter((p) => p.status === "disetujui");
  const pending = state.pengajuan.filter(
    (p) => p.status === "diajukan" || p.status === "perlu_revisi",
  );

  const totalApproved = approved
    .filter((p) => p.type === "in_cash")
    .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);
  const totalPending = pending
    .filter((p) => p.type === "in_cash")
    .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);

  // Top pendana by nilai in-cash disetujui
  const topFunders = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of approved) {
      if (p.type !== "in_cash") continue;
      totals.set(p.funderId, (totals.get(p.funderId) ?? 0) + (p.requestedAmount ?? 0));
    }
    return state.funders
      .map((f) => ({ funder: f, total: totals.get(f.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [approved, state.funders]);

  // Top organisasi by nilai in-cash disetujui
  const topOrgs = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of approved) {
      if (p.type !== "in_cash") continue;
      totals.set(p.orgId, (totals.get(p.orgId) ?? 0) + (p.requestedAmount ?? 0));
    }
    return state.organizations
      .map((o) => ({ org: o, total: totals.get(o.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [approved, state.organizations]);

  const exportCsv = () => {
    const rows = state.pengajuan
      .filter((p) => p.status !== "draf")
      .map((p) => {
        const org = state.organizations.find((o) => o.id === p.orgId);
        const f = state.funders.find((x) => x.id === p.funderId);
        return [
          p.id,
          p.eventName,
          org?.name ?? "",
          f?.name ?? "",
          p.type,
          p.type === "in_cash" ? (p.requestedAmount ?? 0) : "",
          p.status,
          p.createdAt,
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",");
      });
    const header = "id,event,organisasi,pendana,jenis,nilai_in_cash,status,dibuat";
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengajuan-sponsorhub-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Topbar title="Laporan" />
      <div className="sh-shell__content">
        <PageHead
          title="Laporan"
          subtitle="Ringkasan pendanaan, top pendana, dan top organisasi."
          actions={
            <button className="sh-btn sh-btn--secondary" onClick={exportCsv}>
              Ekspor CSV
            </button>
          }
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disetujui (in-cash)"
            value={formatRupiah(totalApproved)}
            icon={<CheckCircle2 size={20} />}
          />
          <StatCard
            label="Menunggu keputusan (in-cash)"
            value={formatRupiah(totalPending)}
            icon={<Clock size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={approved.length}
            icon={<Banknote size={20} />}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Top pendana (nilai disetujui)</h2>
            </header>
            {topFunders.every((t) => t.total === 0) ? (
              <Empty title="Belum ada data" />
            ) : (
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Pendana</th>
                      <th>Total disetujui</th>
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

          <section className="sh-card">
            <header className="sh-card__header">
              <h2>Top organisasi (nilai disetujui)</h2>
            </header>
            {topOrgs.every((t) => t.total === 0) ? (
              <Empty title="Belum ada data" />
            ) : (
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Organisasi</th>
                      <th>Total disetujui</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topOrgs.map(({ org, total }) => (
                      <tr key={org.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{org.name}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {org.category} · {org.city}
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
