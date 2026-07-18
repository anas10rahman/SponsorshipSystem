import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { pengajuanBadge, pengajuanAmountLabel, packageCountLabel } from "@/lib/pengajuan";
import type { PengajuanStatus } from "@/lib/types";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "diajukan", label: "Diajukan" },
  { value: "perlu_revisi", label: "Perlu revisi" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
  { value: "draf", label: "Draf" },
];

export default function AdminPengajuan() {
  const { state } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("semua");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.pengajuan
      .filter((p) => (filter === "semua" ? true : p.status === filter))
      .filter((p) => {
        if (!q) return true;
        const org = state.organizations.find((o) => o.id === p.orgId);
        const funder = state.funders.find((f) => f.id === p.funderId);
        return [p.id, p.eventName, org?.name, funder?.name].some((s) =>
          String(s ?? "").toLowerCase().includes(q),
        );
      });
  }, [state.pengajuan, state.organizations, state.funders, filter, search]);

  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <Topbar
        title="Pengajuan terarah"
        search={{ value: search, onChange: setSearch, placeholder: "Cari event, org, pendana…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Pengajuan terarah"
          subtitle="Pemantauan pengajuan langsung organisasi → pendana. Read-only; persetujuan dilakukan pendana."
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Empty title="Tidak ada pengajuan" />
        ) : (
          <section className="sh-card">
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event</th>
                    <th>Organisasi</th>
                    <th>Pendana</th>
                    <th>Paket</th>
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const org = state.organizations.find((o) => o.id === p.orgId);
                    const funder = state.funders.find((f) => f.id === p.funderId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td>
                          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                            {p.id}
                          </code>
                        </td>
                        <td>{p.eventName}</td>
                        <td>{org?.name ?? "—"}</td>
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
          </section>
        )}
      </div>

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
