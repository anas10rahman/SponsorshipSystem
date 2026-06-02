import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";

const CATEGORIES = [
  "Semua",
  "Teknologi",
  "Edukasi",
  "Hiburan",
  "Olahraga",
  "Kuliner",
  "Seni & Budaya",
];

export default function FunderJelajahi() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Semua");

  const proposals = useMemo(
    () =>
      state.proposals.filter((p) => {
        if (p.status !== "aktif") return false;
        const matchesCat = cat === "Semua" || p.category === cat;
        const q = query.trim().toLowerCase();
        const matchesQ =
          !q ||
          [p.title, p.category, p.city].join(" ").toLowerCase().includes(q);
        return matchesCat && matchesQ;
      }),
    [state.proposals, query, cat],
  );

  return (
    <>
      <Topbar
        title="Jelajahi proposal"
        search={{ value: query, onChange: setQuery, placeholder: "Cari proposal…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Jelajahi proposal"
          subtitle="Temukan proposal yang sesuai dengan fokus dan kapasitas pendanaan Anda."
        />

        <div className="sh-toolbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`sh-chip${cat === c ? " is-active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {proposals.length === 0 ? (
          <Empty
            title="Belum ada proposal yang sesuai"
            description="Coba ubah filter kategori atau kata kunci pencarian."
          />
        ) : (
          <div className="sh-proposal-grid">
            {proposals.map((p) => {
              const org = state.organizations.find((o) => o.id === p.orgId);
              const pct = percent(p.raised, p.target);
              return (
                <article key={p.id} className="sh-proposal">
                  <div className="sh-proposal__header">
                    <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
                      <span className="sh-org-logo">{org?.logoInitials ?? "—"}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="sh-proposal__title">{p.title}</div>
                        <div className="sh-proposal__org">{org?.name}</div>
                      </div>
                    </div>
                    <StatusBadge kind="custom" label={p.category} variant="info" />
                  </div>

                  <div className="sh-progress">
                    <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="sh-progress__meta">
                    <span>{formatRupiah(p.raised)}</span>
                    <span>dari {formatRupiah(p.target)}</span>
                  </div>

                  <div className="sh-proposal__cta">
                    <Link
                      to={`/funder/proposal/${p.id}`}
                      className="sh-btn sh-btn--primary sh-btn--sm"
                      style={{ width: "100%" }}
                    >
                      Lihat detail
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
