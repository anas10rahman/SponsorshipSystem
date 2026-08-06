import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { pengajuanBadge, pengajuanAmountLabel, packageCountLabel } from "@/lib/pengajuan";
import type { PengajuanStatus } from "@/lib/types";
import { Edit3, Eye } from "lucide-react";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "draf", label: "Draf" },
  { value: "diajukan", label: "Diajukan" },
  { value: "perlu_revisi", label: "Perlu revisi" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
  { value: "kadaluarsa", label: "Kadaluarsa" },
];

export default function OrgPengajuanList() {
  const { state, currentUser } = useStore();
  const navigate = useNavigate();
  const orgId = currentUser?.orgId ?? "";
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [params, setParams] = useSearchParams();

  // Notifikasi menautkan ke pengajuan tertentu (?id=) — langsung buka detailnya.
  useEffect(() => {
    const id = params.get("id");
    if (id) setSelectedId(id);
  }, [params]);

  const closeDetail = () => {
    setSelectedId(null);
    if (params.has("id")) {
      params.delete("id");
      setParams(params, { replace: true });
    }
  };

  const mine = useMemo(
    () => state.pengajuan.filter((p) => p.orgId === orgId),
    [state.pengajuan, orgId],
  );
  const rows = filter === "semua" ? mine : mine.filter((p) => p.status === filter);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: mine.length };
    for (const s of ["draf", "diajukan", "perlu_revisi", "disetujui", "ditolak", "kadaluarsa"] as const) {
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
          subtitle="Pengajuan sponsorship terarah ke mitra sponsor — lanjutkan draf, pantau status, dan revisi."
          actions={
            <Link to="/org/cari" className="sh-btn sh-btn--primary">
              Ajukan ke mitra sponsor
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
            description="Mulai dengan memilih mitra sponsor di halaman Cari mitra sponsor."
            action={
              <Link to="/org/cari" className="sh-btn sh-btn--primary">
                Ke Cari mitra sponsor
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
                    <th>Mitra Sponsor</th>
                    <th>Paket</th>
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
                        <td data-label="ID">
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {p.id}
                          </code>
                        </td>
                        <td data-label="Event">
                          <div style={{ fontWeight: 600 }}>{p.eventName || "(tanpa judul)"}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {p.eventLocation}
                          </div>
                        </td>
                        <td data-label="Mitra Sponsor">{funder?.name ?? "—"}</td>
                        <td data-label="Paket">{packageCountLabel(p)}</td>
                        <td className="num" data-label="Nominal">{pengajuanAmountLabel(p)}</td>
                        <td data-label="Status">
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td className="sh-muted" data-label="Diperbarui">{formatDate(p.updatedAt)}</td>
                        <td data-label="Aksi">
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

      <PengajuanDetail pengajuan={selected} onClose={closeDetail} />
    </>
  );
}
