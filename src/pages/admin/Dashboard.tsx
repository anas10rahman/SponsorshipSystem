import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatRupiah, formatDate } from "@/lib/format";
import {
  pengajuanBadge,
  pengajuanAmountLabel,
  SUBMISSION_FEE,
  REJECT_ADMIN_FEE,
} from "@/lib/pengajuan";
import { Wallet, Send, CheckCircle2, Building2, Hourglass } from "lucide-react";

export default function AdminDashboard() {
  const { state } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* Saldo platform dari biaya pengajuan. Biaya dipungut sekali saat organisasi
     pertama kali mengirim pengajuan (Rp 50rb), lalu nasibnya ditentukan
     keputusan mitra sponsor:
       disetujui  -> seluruh 50rb menjadi pendapatan admin
       ditolak    -> 10rb ditahan admin, 40rb dikembalikan ke organisasi
       kadaluarsa -> 50rb dikembalikan penuh (admin tidak menahan apa pun)
       diajukan / perlu revisi -> masih ditahan, belum jadi pendapatan */
  const stats = useMemo(() => {
    const sent = state.pengajuan.filter((p) => p.status !== "draf");
    const by = (s: string) => sent.filter((p) => p.status === s).length;

    const disetujui = by("disetujui");
    const ditolak = by("ditolak");
    const tertahan = by("diajukan") + by("perlu_revisi");

    return {
      sent: sent.length,
      approved: disetujui,
      orgAktif: state.organizations.filter((o) => o.verified).length,
      // Sudah final menjadi milik platform.
      saldoDiterima: disetujui * SUBMISSION_FEE + ditolak * REJECT_ADMIN_FEE,
      // Masih menggantung: sebagian bisa kembali ke organisasi.
      saldoSementara: tertahan * SUBMISSION_FEE,
      jumlahTertahan: tertahan,
    };
  }, [state.pengajuan, state.organizations]);

  const recent = state.pengajuan.filter((p) => p.status !== "draf").slice(0, 6);
  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar />
      <div className="sh-shell__content">
        <Hero />

        <div className="sh-stat-grid">
          <StatCard
            label="Saldo Diterima"
            value={formatRupiah(stats.saldoDiterima)}
            icon={<Wallet size={20} />}
          />
          <StatCard
            label="Saldo Sementara"
            value={formatRupiah(stats.saldoSementara)}
            icon={<Hourglass size={20} />}
            trend={
              stats.jumlahTertahan > 0
                ? { direction: "up", label: `${stats.jumlahTertahan} pengajuan menunggu keputusan` }
                : undefined
            }
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
                  <th>Mitra Sponsor</th>
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
                      <td style={{ fontWeight: 600 }} data-label="Event">{p.eventName}</td>
                      <td data-label="Organisasi">{org?.name ?? "—"}</td>
                      <td data-label="Mitra Sponsor">{funder?.name ?? "—"}</td>
                      <td className="num" data-label="Nilai">{pengajuanAmountLabel(p)}</td>
                      <td data-label="Status">
                        <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                      </td>
                      <td className="sh-muted" data-label="Tanggal">{formatDate(p.updatedAt)}</td>
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
