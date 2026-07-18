import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { useStore } from "@/lib/store";
import { Send } from "lucide-react";

export default function OrgCariPendana() {
  const { state } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.funders.filter((f) =>
      !q ? true : [f.name, f.type, ...f.focus].some((s) => s.toLowerCase().includes(q)),
    );
  }, [state.funders, query]);

  return (
    <>
      <Topbar
        title="Cari pendana"
        search={{ value: query, onChange: setQuery, placeholder: "Cari pendana / fokus…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Cari pendana"
          subtitle="Pilih pendana yang sesuai, lalu ajukan proposal sponsorship langsung ke mereka."
        />

        {rows.length === 0 ? (
          <Empty title="Tidak ada pendana yang cocok" />
        ) : (
          <div className="sh-proposal-grid">
            {rows.map((f) => {
              return (
                <article key={f.id} className="sh-proposal">
                  <div className="sh-proposal__header">
                    <div className="sh-row" style={{ gap: 10, minWidth: 0 }}>
                      <span className="sh-org-logo">
                        {f.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="sh-proposal__title">{f.name}</div>
                        <div className="sh-proposal__org">{f.type}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="sh-meta-label">Fokus pendanaan</div>
                    <div className="sh-meta-value" style={{ fontSize: 13 }}>
                      {f.focus.join(", ")}
                    </div>
                  </div>
                  <div className="sh-row" style={{ gap: 8, marginTop: "auto" }}>
                    <button
                      className="sh-btn sh-btn--secondary sh-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/org/pendana/${f.id}`)}
                    >
                      Lihat profil
                    </button>
                    <button
                      className="sh-btn sh-btn--primary sh-btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => navigate(`/org/pengajuan/baru?funder=${f.id}`)}
                    >
                      <Send size={14} />
                      Ajukan
                    </button>
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
