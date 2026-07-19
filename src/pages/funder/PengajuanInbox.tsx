import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { pengajuanBadge, pengajuanAmountLabel, packageCountLabel } from "@/lib/pengajuan";
import type { PengajuanStatus } from "@/lib/types";
import { Eye } from "lucide-react";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "Semua" },
  { value: "diajukan", label: "Perlu ditinjau" },
  { value: "perlu_revisi", label: "Diberi feedback" },
  { value: "disetujui", label: "Disetujui" },
  { value: "ditolak", label: "Ditolak" },
];

export default function FunderPengajuanInbox() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("diajukan");

  const inbox = useMemo(
    () => state.pengajuan.filter((p) => p.funderId === funderId && p.status !== "draf"),
    [state.pengajuan, funderId],
  );
  const rows = filter === "semua" ? inbox : inbox.filter((p) => p.status === filter);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: inbox.length };
    for (const s of ["diajukan", "perlu_revisi", "disetujui", "ditolak"] as const) {
      c[s] = inbox.filter((p) => p.status === s).length;
    }
    return c;
  }, [inbox]);

  return (
    <>
      <Topbar title="Pengajuan masuk" />
      <div className="sh-shell__content">
        <PageHead
          title="Pengajuan masuk"
          subtitle="Tinjau pengajuan sponsorship dari organisasi. Persetujuan Anda bersifat final."
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
            title="Tidak ada pengajuan"
            description="Pengajuan dari organisasi akan muncul di sini."
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
                    <th>Nominal</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th style={{ width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const org = state.organizations.find((o) => o.id === p.orgId);
                    const badge = pengajuanBadge(p.status);
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.eventName}</div>
                          <div className="sh-muted" style={{ fontSize: 12 }}>
                            {p.eventLocation}
                          </div>
                        </td>
                        <td>
                          {org ? (
                            <Link to={`/funder/organisasi/${org.id}`}>{org.name}</Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>{packageCountLabel(p)}</td>
                        <td className="num">{pengajuanAmountLabel(p)}</td>
                        <td>
                          <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                        </td>
                        <td className="sh-muted">{formatDate(p.updatedAt)}</td>
                        <td>
                          <Link
                            to={`/funder/pengajuan/${p.id}`}
                            className="sh-btn sh-btn--ghost sh-btn--sm"
                          >
                            <Eye size={14} />
                            Tinjau
                          </Link>
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
    </>
  );
}
