import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import { pengajuanBadge } from "@/lib/pengajuan";
import { Wallet, Send, CheckCircle2, Building2 } from "lucide-react";

export default function AdminDashboard() {
  const { state } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const sent = state.pengajuan.filter((p) => p.status !== "draf");
    const approved = sent.filter((p) => p.status === "disetujui");
    const approvedCash = approved
      .filter((p) => p.type === "in_cash")
      .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);
    return {
      sent: sent.length,
      approved: approved.length,
      approvedCash,
      orgAktif: state.organizations.filter((o) => o.verified).length,
    };
  }, [state.pengajuan, state.organizations]);

  const recent = state.pengajuan.filter((p) => p.status !== "draf").slice(0, 6);
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar title="Dashboard Admin" />
      <div className="sh-shell__content">
        <Hero />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disetujui (in-cash)"
            value={formatRupiah(stats.approvedCash)}
            icon={<Wallet size={20} />}
          />
          <StatCard label="Pengajuan dikirim" value={stats.sent} icon={<Send size={20} />} />
          <StatCard
            label="Pengajuan disetujui"
            value={stats.approved}
            icon={<CheckCircle2 size={20} />}
          />
          <StatCard
            label="Organisasi aktif"
            value={stats.orgAktif}
            icon={<Building2 size={20} />}
          />
        </div>

        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Pengajuan terbaru</h2>
          </header>
          <div className="sh-table-wrap">
            <table className="sh-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organisasi</th>
                  <th>Pendana</th>
                  <th>Nilai</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => {
                  const org = state.organizations.find((o) => o.id === p.orgId);
                  const funder = state.funders.find((f) => f.id === p.funderId);
                  const badge = pengajuanBadge(p.status);
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.eventName}</td>
                      <td>{org?.name ?? "—"}</td>
                      <td>{funder?.name ?? "—"}</td>
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
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={7} className="sh-muted" style={{ textAlign: "center", padding: 24 }}>
                      Belum ada pengajuan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
