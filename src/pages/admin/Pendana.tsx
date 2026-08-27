import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useStore } from "@/lib/store";
import { formatRupiah, percent } from "@/lib/format";

export default function AdminPendana() {
  const { state } = useStore();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.funders;
    return state.funders.filter((f) =>
      [f.name, f.type, ...f.focus].some((s) => s.toLowerCase().includes(q)),
    );
  }, [state.funders, search]);

  return (
    <>
      <Topbar
        search={{ value: search, onChange: setSearch, placeholder: "Search sponsor partner / focus…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Sponsor partner directory"
          subtitle="Track each sponsor partner's budget capacity and commitments."
        />

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="No sponsor partners" />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Sponsor Partner</th>
                    <th>Tipe</th>
                    <th>Fokus</th>
                    <th>Total budget</th>
                    <th>Remaining budget</th>
                    <th style={{ width: 180 }}>Penggunaan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => {
                    const used = f.budgetTotal - f.budgetRemaining;
                    const pct = percent(used, f.budgetTotal);
                    return (
                      <tr key={f.id}>
                        <td data-label="Sponsor Partner">
                          <Link
                            to={`/admin/pendana/${f.id}`}
                            style={{ fontWeight: 700, color: "inherit" }}
                          >
                            {f.name}
                          </Link>
                        </td>
                        <td data-label="Tipe">{f.type}</td>
                        <td data-label="Fokus">{f.focus.join(", ")}</td>
                        <td className="num" data-label="Total budget">{formatRupiah(f.budgetTotal)}</td>
                        <td className="num" data-label="Remaining budget">{formatRupiah(f.budgetRemaining)}</td>
                        <td data-label="Penggunaan">
                          <div className="sh-progress">
                            <div className="sh-progress__bar" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="sh-progress__meta">
                            <span>{pct}% terpakai</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
