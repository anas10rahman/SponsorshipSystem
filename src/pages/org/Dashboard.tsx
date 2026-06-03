import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge } from "@/lib/pengajuan";
import { Wallet, Send, CheckCircle2, ArrowRight } from "lucide-react";

export default function OrgDashboard() {
  const { state, currentUser } = useStore();
  const orgId = currentUser?.orgId;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = useMemo(
    () => state.pengajuan.filter((p) => p.orgId === orgId),
    [state.pengajuan, orgId],
  );
  const approved = mine.filter((p) => p.status === "disetujui");
  const totalApproved = approved
    .filter((p) => p.type === "in_cash")
    .reduce((s, p) => s + (p.requestedAmount ?? 0), 0);
  const recent = mine.slice(0, 6);
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar title="Dashboard Organisasi" />
      <div className="sh-shell__content">
        <PageHead
          title="Dashboard Organisasi"
          subtitle="Pantau pengajuan sponsorship Anda ke para pendana."
          actions={
            <Link to="/org/cari" className="sh-btn sh-btn--primary">
              Buat pengajuan
              <ArrowRight size={16} />
            </Link>
          }
        />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disetujui (in-cash)"
            value={formatRupiah(totalApproved)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Pengajuan dikirim"
            value={mine.filter((p) => p.status !== "draf").length}
            icon={<Send size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={approved.length}
            icon={<CheckCircle2 size={20} />}
          />
        </div>

        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Pengajuan terbaru</h2>
            <Link to="/org/pengajuan" className="sh-btn sh-btn--ghost sh-btn--sm">
              Lihat semua
            </Link>
          </header>
          {recent.length === 0 ? (
            <div className="sh-card__body">
              <p className="sh-muted">
                Belum ada pengajuan.{" "}
                <Link to="/org/cari">Cari pendana</Link> untuk memulai.
              </p>
            </div>
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Pendana</th>
                    <th>Jenis</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th>Diperbarui</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => {
                    const funder = state.funders.find((f) => f.id === p.funderId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.eventName || "(tanpa judul)"}</td>
                        <td>{funder?.name ?? "—"}</td>
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

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
