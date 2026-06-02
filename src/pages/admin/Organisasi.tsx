import { useMemo, useState } from "react";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { Empty } from "@/components/Empty";
import { StatusBadge } from "@/components/StatusBadge";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";

type Filter = "semua" | "verified" | "pending";

export default function AdminOrganisasi() {
  const { state } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.organizations.filter((o) => {
      if (filter === "verified" && !o.verified) return false;
      if (filter === "pending" && o.verified) return false;
      if (!q) return true;
      return [o.name, o.category, o.city].some((s) => s.toLowerCase().includes(q));
    });
  }, [state.organizations, search, filter]);

  return (
    <>
      <Topbar
        title="Direktori organisasi"
        search={{ value: search, onChange: setSearch, placeholder: "Cari organisasi…" }}
      />
      <div className="sh-shell__content">
        <PageHead
          title="Direktori organisasi"
          subtitle="Daftar organisasi terverifikasi dan menunggu verifikasi."
        />

        <div className="sh-toolbar">
          {(["semua", "verified", "pending"] as const).map((f) => (
            <button
              key={f}
              className={`sh-chip${filter === f ? " is-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "semua" ? "Semua" : f === "verified" ? "Terverifikasi" : "Menunggu verifikasi"}
            </button>
          ))}
        </div>

        <section className="sh-card">
          {rows.length === 0 ? (
            <Empty title="Tidak ada organisasi" description="Coba ubah filter." />
          ) : (
            <div className="sh-table-wrap">
              <table className="sh-table">
                <thead>
                  <tr>
                    <th>Organisasi</th>
                    <th>Kategori</th>
                    <th>Kota</th>
                    <th>Status</th>
                    <th>Proposal aktif</th>
                    <th>Total terkumpul</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((org) => {
                    const myProposals = state.proposals.filter((p) => p.orgId === org.id);
                    const aktif = myProposals.filter((p) => p.status === "aktif").length;
                    const raised = myProposals.reduce((s, p) => s + p.raised, 0);
                    return (
                      <tr key={org.id}>
                        <td>
                          <div className="sh-row" style={{ gap: 10 }}>
                            <span className="sh-org-logo">{org.logoInitials}</span>
                            <div>
                              <div style={{ fontWeight: 700 }}>{org.name}</div>
                              <div className="sh-muted" style={{ fontSize: 12 }}>
                                {org.payoutAccount}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>{org.category}</td>
                        <td>{org.city}</td>
                        <td>
                          {org.verified ? (
                            <StatusBadge kind="custom" label="Terverifikasi" variant="success" />
                          ) : (
                            <StatusBadge kind="custom" label="Menunggu" variant="pending" />
                          )}
                        </td>
                        <td>{aktif}</td>
                        <td className="num">{formatRupiah(raised)}</td>
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
