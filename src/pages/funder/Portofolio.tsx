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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const PER_PAGE = [8, 16, 24];

export default function FunderPortofolio() {
  const { state, currentUser } = useStore();
  const funderId = currentUser?.funderId ?? "";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [month, setMonth] = useState("all"); // "all" | "0".."11"
  const [year, setYear] = useState("all");
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

  const years = useMemo(() => {
    const set = new Set<number>();
    for (const p of approved) set.add(new Date(p.createdAt).getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [approved]);

  const rows = useMemo(() => {
    return approved.filter((p) => {
      if (category !== "all" && (orgById.get(p.orgId)?.category ?? "") !== category) return false;
      const d = new Date(p.createdAt);
      if (month !== "all" && d.getMonth() !== Number(month)) return false;
      if (year !== "all" && d.getFullYear() !== Number(year)) return false;
      return true;
    });
  }, [approved, month, year, category, orgById]);

  useEffect(() => setPage(1), [month, year, category, perPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const current = Math.min(page, totalPages);
  const pageRows = rows.slice((current - 1) * perPage, (current - 1) * perPage + perPage);

  const selected = state.pengajuan.find((p) => p.id === selectedId) ?? null;
  const filtered = month !== "all" || year !== "all" || category !== "all";

  return (
    <>
      <Topbar />
      <div className="sh-shell__content">
        <PageHead
          title="Collaboration Portfolio"
          subtitle="A history of the events you have supported through DealMatch."
        />

        <section className="sh-card" style={{ marginBottom: 20 }}>
          <div className="dm-toolbar" style={{ borderBottom: 0 }}>
            <div className="sh-field" style={{ margin: 0, minWidth: 160 }}>
              <label className="sh-field__label">Submission Month</label>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="all">All months</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={String(i)}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="sh-field" style={{ margin: 0, minWidth: 140 }}>
              <label className="sh-field__label">Submission Year</label>
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="all">All years</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div className="sh-field" style={{ margin: 0, minWidth: 200 }}>
              <label className="sh-field__label">Event Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
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
                setMonth("all");
                setYear("all");
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
            title={approved.length === 0 ? "No collaborations yet" : "Nothing matches"}
            description={
              approved.length === 0
                ? "Submissions you approve appear here as your portfolio."
                : "Try changing the month, year, or category filter."
            }
            action={
              approved.length === 0 ? (
                <Link to="/funder/pengajuan" className="sh-btn sh-btn--primary">
                  Go to Sponsorship Submissions
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
                        <StatusBadge kind="custom" label="Approved" variant="success" />
                        {pkg?.name && <StatusBadge kind="custom" label={pkg.name} variant="pending" />}
                      </div>

                      <div className="dm-pcard__meta">
                        <MapPin size={14} />
                        {p.eventLocation || "—"}
                      </div>
                      <div className="dm-pcard__meta">
                        <CalendarDays size={14} />
                        {p.eventDate ? formatDate(p.eventDate) : "Event date not filled in"}
                      </div>
                      {amount > 0 && (
                        <div className="dm-pcard__meta" style={{ fontWeight: 700 }}>
                          {formatRupiah(amount)}
                        </div>
                      )}

                      {benefits.length > 0 && (
                        <div>
                          <div className="sh-meta-label" style={{ marginBottom: 4 }}>
                            Benefits provided
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
                        View details
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
