import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { Empty } from "@/components/Empty";
import { StatCard } from "@/components/StatCard";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/format";
import { pengajuanAmountLabel, packageCountLabel, selectedAmount } from "@/lib/pengajuan";
import { Banknote, Building2, Wallet, ArrowRight } from "lucide-react";

export default function FunderPortofolio() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";
  const funder = state.funders.find((f) => f.id === funderId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const approved = useMemo(
    () =>
      state.pengajuan.filter((p) => p.funderId === funderId && p.status === "disetujui"),
    [state.pengajuan, funderId],
  );

  const totalCash = approved.reduce((s, p) => s + selectedAmount(p), 0);
  const orgsFunded = new Set(approved.map((p) => p.orgId)).size;
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar title="Portofolio sponsor" />
      <div className="sh-shell__content">
        <Hero />

        <div className="sh-stat-grid">
          <StatCard
            label="Total disponsori"
            value={formatRupiah(totalCash)}
            icon={<Banknote size={20} />}
          />
          <StatCard
            label="Pengajuan disetujui"
            value={approved.length}
            icon={<Building2 size={20} />}
          />
          <StatCard
            label="Organisasi didanai"
            value={orgsFunded}
            icon={<Building2 size={20} />}
          />
          {funder && (
            <StatCard
              label="Sisa anggaran"
              value={formatRupiah(funder.budgetRemaining)}
              icon={<Wallet size={20} />}
            />
          )}
        </div>

        {approved.length === 0 ? (
          <Empty
            title="Belum ada pengajuan yang disetujui"
            description="Pengajuan yang Anda setujui akan muncul di sini."
            action={
              <Link to="/funder/pengajuan" className="sh-btn sh-btn--primary">
                Ke Pengajuan masuk
                <ArrowRight size={14} />
              </Link>
            }
          />
        ) : (
          <section className="sh-card">
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Organisasi</th>
                    <th>Paket</th>
                    <th>Nilai</th>
                    <th>Tanggal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {approved.map((p) => {
                    const org = state.organizations.find((o) => o.id === p.orgId);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.eventName}</td>
                        <td>{org?.name ?? "—"}</td>
                        <td>{packageCountLabel(p)}</td>
                        <td className="num">{pengajuanAmountLabel(p)}</td>
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
          </section>
        )}
      </div>

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
