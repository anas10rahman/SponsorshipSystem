import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { PengajuanDetail } from "@/components/PengajuanDetail";
import { AppFooter } from "@/components/AppFooter";
import { Pager } from "./PengajuanInbox";
import { useStore } from "@/lib/store";
import { formatDate, formatRupiah, initials } from "@/lib/format";
import { selectedAmount } from "@/lib/pengajuan";
import {
  MapPin,
  CalendarDays,
  Check,
  RotateCcw,
  ArrowRight,
  CalendarClock,
} from "lucide-react";

const DATE_RANGES: Array<{ value: string; label: string; days: number | null }> = [
  { value: "all", label: "Semua tanggal", days: null },
  { value: "30", label: "30 hari terakhir", days: 30 },
  { value: "90", label: "90 hari terakhir", days: 90 },
  { value: "365", label: "1 tahun terakhir", days: 365 },
];

const PER_PAGE = [8, 16, 24];

export default function FunderPortofolio() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [range, setRange] = useState("all");
  const [category, setCategory] = useState("all");
  const [perPage, setPerPage] = useState(PER_PAGE[0]);
  const [page, setPage] = useState(1);

  const orgById = useMemo(
    () => new Map(state.organizations.map((o) => [o.id, o])),
    [state.organizations],
  );

  // Portofolio = kolaborasi yang benar-benar terjadi (pengajuan disetujui).
  const approved = useMemo(
    () => state.pengajuan.filter((p) => p.funderId === funderId && p.status === "disetujui"),
    [state.pengajuan, funderId],
  );

  // Kategori event diambil dari profil organisasi pengaju.
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of approved) {
      const c = orgById.get(p.orgId)?.category?.trim();
      if (c) set.add(c);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "id"));
  }, [approved, orgById]);

  const rows = useMemo(() => {
    const days = DATE_RANGES.find((r) => r.value === range)?.days ?? null;
    const since = days ? Date.now() - days * 86400_000 : null;
    return approved.filter((p) => {
      if (category !== "all" && (orgById.get(p.orgId)?.category ?? "") !== category) return false;
      if (since && new Date(p.createdAt).getTime() < since) return false;
      return true;
    });
  }, [approved, range, category, orgById]);

  useEffect(() => setPage(1), [range, category, perPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * perPage, (current - 1) * perPage + perPage);

  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;
  const filtered = range !== "all" || category !== "all";

  return (
    <>
      <Topbar title="Portofolio Kolaborasi" />
      <div className="sh-shell__content">
        <PageHead
          title="Portofolio Kolaborasi"
          subtitle="Riwayat event yang telah Anda dukung melalui DealMatch."
        />

        <section className="sh-card" style={{ marginBottom: 20 }}>
          <div className="dm-toolbar" style={{ borderBottom: 0 }}>
            <div className="sh-field" style={{ margin: 0, minWidth: 200 }}>
              <label className="sh-field__label">Tanggal Pengajuan</label>
              <select value={range} onChange={(e) => setRange(e.target.value)}>
                {DATE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sh-field" style={{ margin: 0, minWidth: 200 }}>
              <label className="sh-field__label">Kategori Event</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">Semua kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="dm-toolbar__spacer" />
            <button
              className="sh-btn sh-btn--secondary"
              onClick={() => {
                setRange("all");
                setCategory("all");
              }}
              disabled={!filtered}
            >
              <RotateCcw size={16} />
              Reset Filter
            </button>
          </div>
        </section>

        {rows.length === 0 ? (
          <Empty
            title={approved.length === 0 ? "Belum ada kolaborasi" : "Tidak ada yang cocok"}
            description={
              approved.length === 0
                ? "Pengajuan yang Anda setujui akan muncul di sini sebagai portofolio."
                : "Coba ubah filter tanggal atau kategori."
            }
            action={
              approved.length === 0 ? (
                <Link to="/funder/pengajuan" className="sh-btn sh-btn--primary">
                  Ke Pengajuan Sponsorship
                  <ArrowRight size={14} />
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="dm-pgrid">
              {pageRows.map((p) => {
                const org = orgById.get(p.orgId);
                const pkg = p.selectedPackage != null ? p.packages[p.selectedPackage] : undefined;
                // Batasi 4 benefit agar tinggi kartu seragam; sisanya di detail.
                const benefits = (pkg?.benefits ?? []).slice(0, 4);
                const more = (pkg?.benefits ?? []).length - benefits.length;
                const amount = selectedAmount(p);
                return (
                  <article key={p.id} className="dm-pcard">
                    <header className="dm-pcard__head">
                      <span className="dm-pcard__logo">
                        {org?.logoUrl ? <img src={org.logoUrl} alt="" /> : initials(org?.name ?? "?")}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="dm-pcard__title">{p.eventName}</div>
                        <div className="dm-pcard__org">{org?.name ?? "—"}</div>
                      </div>
                    </header>

                    <div className="dm-pcard__body">
                      <div className="sh-row" style={{ gap: 8, flexWrap: "wrap" }}>
                        <StatusBadge kind="custom" label="Disetujui" variant="success" />
                        {pkg?.name && <StatusBadge kind="custom" label={pkg.name} variant="pending" />}
                      </div>

                      <div className="dm-pcard__meta">
                        <MapPin size={14} />
                        {p.eventLocation || "—"}
                      </div>
                      <div className="dm-pcard__meta">
                        <CalendarDays size={14} />
                        {p.eventDate ? formatDate(p.eventDate) : "Tanggal event belum diisi"}
                      </div>
                      {amount > 0 && (
                        <div className="dm-pcard__meta" style={{ fontWeight: 700 }}>
                          {formatRupiah(amount)}
                        </div>
                      )}

                      {benefits.length > 0 && (
                        <div>
                          <div className="sh-meta-label" style={{ marginBottom: 4 }}>
                            Benefit yang diberikan
                          </div>
                          <ul className="dm-pcard__benefits">
                            {benefits.map((b, i) => (
                              <li key={i}>
                                <Check size={14} />
                                {b}
                              </li>
                            ))}
                          </ul>
                          {more > 0 && (
                            <div className="sh-muted" style={{ fontSize: 12, marginTop: 4 }}>
                              +{more} benefit lain
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        className="sh-btn sh-btn--ghost sh-btn--sm"
                        style={{ alignSelf: "flex-start", marginTop: "auto" }}
                        onClick={() => setSelectedId(p.id)}
                      >
                        Lihat detail
                      </button>
                    </div>

                    <footer className="dm-pcard__foot">
                      <CalendarClock size={14} />
                      Tanggal Pengajuan: {formatDate(p.createdAt)}
                    </footer>
                  </article>
                );
              })}
            </div>

            <section className="sh-card" style={{ marginTop: 18 }}>
              <Pager
                total={rows.length}
                page={current}
                perPage={perPage}
                totalPages={totalPages}
                onPage={setPage}
                onPerPage={setPerPage}
                options={PER_PAGE}
              />
            </section>
          </>
        )}

        <AppFooter />
      </div>

      <PengajuanDetail pengajuan={selected} onClose={() => setSelectedId(null)} />
    </>
  );
}
