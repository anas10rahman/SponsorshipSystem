import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import { Wallet, ClockAlert, ListChecks, Building2 } from "lucide-react";

export default function AdminDashboard() {
  const { state } = useStore();

  const disalurkan = state.transactions
    .filter((t) => t.status === "disalurkan")
    .reduce((sum, t) => sum + t.amount, 0);
  const menunggu = state.transactions.filter((t) => t.status === "menunggu").length;
  const totalTx = state.transactions.length;
  const orgAktif = state.organizations.filter((o) => o.verified).length;

  const recent = state.transactions.slice(0, 6);

  return (
    <>
      <Topbar title="Dashboard Admin" />
      <div className="sh-shell__content">
        <PageHead
          title="Dashboard Admin"
          subtitle="Pantau semua transaksi, verifikasi, dan organisasi aktif."
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disalurkan"
            value={formatRupiah(disalurkan)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Jumlah transaksi"
            value={totalTx}
            icon={<ListChecks size={20} />}
          />
          <StatCard
            label="Menunggu verifikasi"
            value={menunggu}
            icon={<ClockAlert size={20} />}
          />
          <StatCard
            label="Organisasi aktif"
            value={orgAktif}
            icon={<Building2 size={20} />}
          />
        </div>

        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Transaksi terbaru</h2>
          </header>
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Organisasi</th>
                  <th>Pendana</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => {
                  const org = state.organizations.find((o) => o.id === t.orgId);
                  const f = state.funders.find((x) => x.id === t.funderId);
                  return (
                    <tr key={t.id}>
                      <td>
                        <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                          {t.id}
                        </code>
                      </td>
                      <td>{org?.name ?? "—"}</td>
                      <td>{f?.name ?? "—"}</td>
                      <td className="num">{formatRupiah(t.amount)}</td>
                      <td>
                        <StatusBadge kind="tx" status={t.status} />
                      </td>
                      <td className="sh-muted">{formatDate(t.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
