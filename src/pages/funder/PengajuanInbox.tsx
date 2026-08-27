import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { AppFooter } from "@/components/AppFooter";
import { useStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { pengajuanBadge, pengajuanAmountLabel } from "@/lib/pengajuan";
import type { PengajuanStatus } from "@/lib/types";
import { Eye, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

const FILTERS: Array<{ value: "semua" | PengajuanStatus; label: string }> = [
  { value: "semua", label: "All" },
  { value: "diajukan", label: "Perlu Ditinjau" },
  { value: "perlu_revisi", label: "Diberi Feedback" },
  { value: "disetujui", label: "Approved" },
  { value: "ditolak", label: "Rejected" },
  { value: "kadaluarsa", label: "Expired" },
];

const PER_PAGE_OPTIONS = [7, 15, 30];

/** Rentang tanggal pengajuan — dihitung mundur dari hari ini. */
const DATE_RANGES: Array<{ value: string; label: string; days: number | null }> = [
  { value: "all", label: "All dates", days: null },
  { value: "7", label: "7 hari terakhir", days: 7 },
  { value: "30", label: "30 hari terakhir", days: 30 },
  { value: "90", label: "90 hari terakhir", days: 90 },
];

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function FunderPengajuanInbox() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";
  const [params, setParams] = useSearchParams();

  // Status awal bisa datang dari kartu dashboard (?status=...).
  const initial = params.get("status") as (typeof FILTERS)[number]["value"] | null;
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>(
    initial && FILTERS.some((f) => f.value === initial) ? initial : "semua",
  );
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("all");
  const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
  const [page, setPage] = useState(1);

  // Draf organisasi belum terkirim → tidak pernah tampil di sisi mitra sponsor.
  const inbox = useMemo(
    () => state.pengajuan.filter((p) => p.funderId === funderId && p.status !== "draf"),
    [state.pengajuan, funderId],
  );

  const orgById = useMemo(
    () => new Map(state.organizations.map((o) => [o.id, o])),
    [state.organizations],
  );

  // Kategori diambil dari profil organisasi pengaju (pengajuan tak punya kategori sendiri).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of inbox) {
      const c = orgById.get(p.orgId)?.category?.trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [inbox, orgById]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { semua: inbox.length };
    for (const f of FILTERS) {
      if (f.value !== "semua") c[f.value] = inbox.filter((p) => p.status === f.value).length;
    }
    return c;
  }, [inbox]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const days = DATE_RANGES.find((r) => r.value === range)?.days ?? null;
    const since = days ? Date.now() - days * 86400_000 : null;
    return inbox.filter((p) => {
      if (filter !== "semua" && p.status !== filter) return false;
      const org = orgById.get(p.orgId);
      if (category !== "all" && (org?.category ?? "") !== category) return false;
      if (since && new Date(p.createdAt).getTime() < since) return false;
      if (q) {
        const hay = `${p.eventName} ${org?.name ?? ""} ${p.eventLocation}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [inbox, filter, query, category, range, orgById]);

  // Filter berubah → kembali ke halaman pertama agar tidak tersangkut di halaman kosong.
  useEffect(() => setPage(1), [filter, query, category, range, perPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);

  const setFilterAndUrl = (v: (typeof FILTERS)[number]["value"]) => {
    setFilter(v);
    // Simpan di URL supaya bisa di-bookmark / dibagikan.
    if (v === "semua") params.delete("status");
    else params.set("status", v);
    setParams(params, { replace: true });
  };

  const downloadCsv = () => {
    const header = ["ID", "Organization", "Event", "Category", "Lokasi", "Date", "Status", "Nominal"];
    const lines = rows.map((p) => {
      const org = orgById.get(p.orgId);
      return [
        p.id,
        org?.name ?? "",
        p.eventName,
        org?.category ?? "",
        p.eventLocation,
        formatDate(p.createdAt),
        pengajuanBadge(p.status).label,
        pengajuanAmountLabel(p),
      ]
        .map(csvCell)
        .join(",");
    });
    // BOM agar Excel membaca karakter Indonesia dengan benar.
    const blob = new Blob(["﻿" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pengajuan-sponsorship-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Topbar />
      <div className="sh-shell__content">
        <PageHead
          title="Sponsorship Submissions"
          subtitle="Manage every sponsorship submission coming in from organizations."
        />

        <div className="sh-toolbar">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`sh-chip${filter === f.value ? " is-active" : ""}`}
              onClick={() => setFilterAndUrl(f.value)}
            >
              {f.label}
              <span className="sh-muted" style={{ fontWeight: 600 }}>
                ({counts[f.value] ?? 0})
              </span>
            </button>
          ))}
        </div>

        <section className="sh-card">
          <div className="dm-toolbar">
            <div className="dm-toolbar__search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search event or organization name…"
                aria-label="Search submissions"
              />
            </div>

            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Submission date range"
              style={{ width: "auto", minWidth: 170 }}
            >
              {DATE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Organization category"
              style={{ width: "auto", minWidth: 160 }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              className="sh-btn sh-btn--secondary"
              onClick={downloadCsv}
              disabled={rows.length === 0}
              title="Download the filtered list as CSV"
            >
              <Download size={16} />
              Unduh Laporan
            </button>
          </div>

          {rows.length === 0 ? (
            <Empty
              title="No submissions"
              description={
                inbox.length === 0
                  ? "Submissions from organizations will appear here."
                  : "Nothing matches the filter. Try different keywords or filters."
              }
            />
          ) : (
            <>
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Event</th>
                      <th>Category</th>
                      <th>Submission Date</th>
                      <th>Status</th>
                      <th style={{ width: 130 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((p) => {
                      const org = orgById.get(p.orgId);
                      const badge = pengajuanBadge(p.status);
                      return (
                        <tr key={p.id}>
                          <td data-label="Organization">
                            {org ? (
                              <Link to={`/funder/organisasi/${org.id}`}>{org.name}</Link>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td data-label="Event">
                            <div style={{ fontWeight: 600 }}>{p.eventName}</div>
                            <div className="sh-muted" style={{ fontSize: 12 }}>
                              {p.eventLocation}
                            </div>
                          </td>
                          <td data-label="Category">{org?.category || "—"}</td>
                          <td className="sh-muted" data-label="Submission Date">{formatDate(p.createdAt)}</td>
                          <td data-label="Status">
                            <StatusBadge kind="custom" label={badge.label} variant={badge.variant} />
                          </td>
                          <td data-label="Aksi">
                            <Link
                              to={`/funder/pengajuan/${p.id}`}
                              className="sh-btn sh-btn--ghost sh-btn--sm"
                            >
                              <Eye size={14} />
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pager
                total={rows.length}
                page={current}
                perPage={perPage}
                totalPages={totalPages}
                onPage={setPage}
                onPerPage={setPerPage}
              />
            </>
          )}
        </section>

        <AppFooter />
      </div>
    </>
  );
}

/** Paginasi + pemilih jumlah baris. Dipakai bersama oleh daftar & portofolio. */
export function Pager({
  total,
  page,
  perPage,
  totalPages,
  onPage,
  onPerPage,
  options = PER_PAGE_OPTIONS,
}: {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  onPage: (n: number) => void;
  onPerPage: (n: number) => void;
  options?: number[];
}) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  // Tampilkan maksimal 5 nomor di sekitar halaman aktif.
  const pages: number[] = [];
  const half = 2;
  let s = Math.max(1, page - half);
  const e = Math.min(totalPages, s + 4);
  s = Math.max(1, e - 4);
  for (let i = s; i <= e; i++) pages.push(i);

  return (
    <div className="dm-pager">
      <span>
        Menampilkan {from} - {to} dari {total} data
      </span>

      <div className="dm-pager__pages">
        <button
          className="dm-pager__btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={15} />
        </button>
        {pages.map((n) => (
          <button
            key={n}
            className={`dm-pager__btn${n === page ? " is-active" : ""}`}
            onClick={() => onPage(n)}
            aria-current={n === page ? "page" : undefined}
          >
            {n}
          </button>
        ))}
        <button
          className="dm-pager__btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <span className="sh-row" style={{ gap: 8 }}>
        Tampilkan
        <select value={perPage} onChange={(e) => onPerPage(Number(e.target.value))}>
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        per halaman
      </span>
    </div>
  );
}
