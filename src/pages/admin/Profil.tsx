import { Link } from "react-router-dom";
import { Topbar } from "@/components/Topbar";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { useStore } from "@/lib/store";
import { formatRupiah, initials } from "@/lib/format";
import { Building2, Users, ListChecks, Send } from "lucide-react";

export default function AdminProfil() {
  const { state, currentUser } = useStore();
  if (!currentUser) return null;

  const disalurkan = state.transactions
    .filter((t) => t.status === "disalurkan")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <Topbar title="Profil saya" />
      <div className="sh-shell__content">
        <PageHead title="Profil saya" subtitle="Akun admin & ringkasan platform." />

        <section className="sh-card" style={{ marginBottom: 20 }}>
          <div className="sh-card__body">
            <div className="sh-row" style={{ gap: 16, flexWrap: "wrap" }}>
              <span className="sh-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
                {initials(currentUser.name)}
              </span>
              <div>
                <h2 style={{ marginBottom: 6 }}>{currentUser.name}</h2>
                <div className="sh-muted">{currentUser.email}</div>
                <div style={{ marginTop: 8 }}>
                  <span className="sh-chip" style={{ cursor: "default" }}>
                    Admin platform
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sh-stat-grid">
          <StatCard label="Organisasi" value={state.organizations.length} icon={<Building2 size={20} />} />
          <StatCard label="Pendana" value={state.funders.length} icon={<Users size={20} />} />
          <StatCard label="Transaksi" value={state.transactions.length} icon={<ListChecks size={20} />} />
          <StatCard label="Total disalurkan" value={formatRupiah(disalurkan)} icon={<Send size={20} />} />
        </div>

        <section className="sh-card">
          <header className="sh-card__header">
            <h2>Direktori</h2>
          </header>
          <div className="sh-card__body sh-row" style={{ gap: 12, flexWrap: "wrap" }}>
            <Link to="/admin/organisasi" className="sh-btn sh-btn--secondary">
              <Building2 size={16} />
              Direktori organisasi
            </Link>
            <Link to="/admin/pendana" className="sh-btn sh-btn--secondary">
              <Users size={16} />
              Direktori pendana
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
