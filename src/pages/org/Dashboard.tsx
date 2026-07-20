import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { OrgVerifyBanner } from "@/components/OrgVerifyBanner";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import { pengajuanBadge, pengajuanAmountLabel, packageCountLabel, selectedAmount } from "@/lib/pengajuan";
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
  const totalApproved = approved.reduce((s, p) => s + selectedAmount(p), 0);
  const recent = mine.slice(0, 6);
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;
  const org = state.organizations.find((o) => o.id === orgId);

  return (
    <>
      <Topbar title="Dashboard Organisasi" />
      <div className="sh-shell__content">
        <Hero />

        {org && <OrgVerifyBanner org={org} />}

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
            <div className="sh-row" style={{ gap: 8 }}>
              <Link to="/org/pengajuan" className="sh-btn sh-btn--ghost sh-btn--sm">
                Lihat semua
              </Link>
              <Link to="/org/cari" className="sh-btn sh-btn--primary sh-btn--sm">
                Buat pengajuan
                <ArrowRight size={14} />
              </Link>
            </div>
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
                    <th>Paket</th>
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
                        <td>{packageCountLabel(p)}</td>
                        <td className="num">{pengajuanAmountLabel(p)}</td>
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
