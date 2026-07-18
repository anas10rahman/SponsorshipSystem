import { useMemo } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Empty } from "@/components/Empty";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { selectedAmount, packageAmount } from "@/lib/pengajuan";
import { Banknote, Clock, CheckCircle2 } from "lucide-react";

export default function AdminLaporan() {
  const { state } = useStore();

  const approved = state.pengajuan.filter((p) => p.status === "disetujui");
  const pending = state.pengajuan.filter(
    (p) => p.status === "diajukan" || p.status === "perlu_revisi",
  );

  // Estimasi maksimum untuk pengajuan yang belum diputuskan (paket termahal).
  const pkgMax = (p: (typeof state.pengajuan)[number]) =>
    Math.max(0, ...(p.packages ?? []).map((k) => packageAmount(k)));

  const totalApproved = approved.reduce((s, p) => s + selectedAmount(p), 0);
  const totalPending = pending.reduce((s, p) => s + pkgMax(p), 0);

  // Top pendana by nilai disetujui (paket terpilih)
  const topFunders = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of approved) {
      totals.set(p.funderId, (totals.get(p.funderId) ?? 0) + selectedAmount(p));
    }
    return state.funders
      .map((f) => ({ funder: f, total: totals.get(f.id) ?? 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [approved, state.funders]);

  // Top organisasi by nilai disetujui (paket terpilih)
  const topOrgs = useMemo(() => {
    const totals = new Map<string, number>();
    for (const p of approved) {
      totals.set(p.orgId, (totals.get(p.orgId) ?? 0) + selectedAmount(p));
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
        const chosen =
          p.selectedPackage != null ? p.packages[p.selectedPackage]?.name ?? "" : "";
        return [
          p.id,
          p.eventName,
          org?.name ?? "",
          f?.name ?? "",
          p.packages?.length ?? 0,
          chosen,
          selectedAmount(p) || "",
          p.status,
          p.createdAt,
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",");
      });
    const header = "id,event,organisasi,pendana,jumlah_paket,paket_terpilih,nilai,status,dibuat";
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
            label="Total disetujui"
            value={formatRupiah(totalApproved)}
            icon={<CheckCircle2 size={20} />}
          />
          <StatCard
            label="Menunggu keputusan (est. maks)"
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
