import { useMemo, useState } from "react";
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
        title="Direktori pendana"
        search={{ value: search, onChange: setSearch, placeholder: "Cari pendana / fokus…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Direktori pendana"
          subtitle="Pantau kapasitas anggaran & komitmen tiap pendana."
        />

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="Tidak ada pendana" />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Pendana</th>
                    <th>Tipe</th>
                    <th>Fokus</th>
                    <th>Anggaran total</th>
                    <th>Sisa anggaran</th>
                    <th style={{ width: 180 }}>Penggunaan</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => {
                    const used = f.budgetTotal - f.budgetRemaining;
                    const pct = percent(used, f.budgetTotal);
                    return (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700 }}>{f.name}</td>
                        <td>{f.type}</td>
                        <td>{f.focus.join(", ")}</td>
                        <td className="num">{formatRupiah(f.budgetTotal)}</td>
                        <td className="num">{formatRupiah(f.budgetRemaining)}</td>
                        <td>
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
