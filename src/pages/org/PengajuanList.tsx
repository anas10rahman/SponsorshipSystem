import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah } from "@/lib/format";
import { pengajuanBadge } from "@/lib/pengajuan";
import type { PengajuanStatus } from "@/lib/types";
import { Edit3, Eye } from "lucide-react";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "draf", label: "Draf" },
  { value: "diajukan", label: "Diajukan" },
  { value: "perlu_revisi", label: "Perlu revisi" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

export default function OrgPengajuanList() {
  const { state, currentUser } = useStore();
  const navigate = useNavigate();
  const orgId = currentUser?.orgId ?? "";
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = useMemo(
    () => state.pengajuan.filter((p) => p.orgId === orgId),
    [state.pengajuan, orgId],
  );
  const rows = filter === "semua" ? mine : mine.filter((p) => p.status === filter);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: mine.length };
    for (const s of ["draf", "diajukan", "perlu_revisi", "disetujui", "ditolak"] as const) {
      c[s] = mine.filter((p) => p.status === s).length;
    }
    return c;
  }, [mine]);

  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar title="Pengajuan saya" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengajuan saya"
          subtitle="Pengajuan sponsorship terarah ke pendana — lanjutkan draf, pantau status, dan revisi."
          actions={
            <Link to="/org/cari" className="sh-btn sh-btn--primary">
              Ajukan ke pendana
            </Link>
          }
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              <span className="sh-muted" style={{ fontWeight: 600 }}>
                ({counts[f.value] ?? 0})
              </span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty
            title="Belum ada pengajuan"
            description="Mulai dengan memilih pendana di halaman Cari pendana."
            action={
              <Link to="/org/cari" className="sh-btn sh-btn--primary">
                Ke Cari pendana
              </Link>
            }
          />
        ) : (
          <section className="sh-card">
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event</th>
                    <th>Pendana</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Diperbarui</th>
                    <th style={{ width: 160 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const funder = state.funders.find((f) => f.id === p.funderId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td>
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {p.id}
                          </code>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.eventName || "(tanpa judul)"}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {p.eventLocation}
                          </div>
                        </td>
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
                          <div className="sh-row" style={{ gap: 6 }}>
                            <button
                              className="sh-btn sh-btn--ghost sh-btn--sm"
                              onClick={() => setSelectedId(p.id)}
                            >
                              <Eye size={14} />
                              Detail
                            </button>
                            {(p.status === "draf" || p.status === "perlu_revisi") && (
                              <button
                                className="sh-btn sh-btn--primary sh-btn--sm"
                                onClick={() => navigate(`/org/pengajuan/${p.id}/edit`)}
                              >
                                <Edit3 size={14} />
                                {p.status === "draf" ? "Lanjutkan" : "Revisi"}
                              </button>
                            )}
                          </div>
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
