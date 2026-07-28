import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  Search,
  Briefcase,
  LogOut,
  Send,
  Inbox,
  Wallet,
  UserCog,
  LifeBuoy,
  ArrowUpRight,
  User,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { useActions, useStore } from "@/lib/store";
import { useSupportEmail } from "./AppFooter";

type Item = { to: string; label: string; icon: React.ReactNode };

const NAV: Record<Role, Item[]> = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/admin/pengajuan", label: "Pengajuan", icon: <Send size={18} /> },
    { to: "/admin/organisasi", label: "Organisasi", icon: <Building2 size={18} /> },
    { to: "/admin/pendana", label: "Mitra Sponsor", icon: <Users size={18} /> },
    { to: "/admin/pengguna", label: "Pengguna", icon: <UserCog size={18} /> },
    { to: "/admin/laporan", label: "Laporan", icon: <FileText size={18} /> },
    { to: "/admin/pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
  ],
  org: [
    { to: "/org/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/org/cari", label: "Cari mitra sponsor", icon: <Search size={18} /> },
    { to: "/org/pengajuan", label: "Pengajuan saya", icon: <Send size={18} /> },
    { to: "/org/topup", label: "Top-up saldo", icon: <Wallet size={18} /> },
  ],
  funder: [
    { to: "/funder/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/funder/pengajuan", label: "Pengajuan Sponsorship", icon: <Inbox size={18} /> },
    { to: "/funder/portofolio", label: "Portofolio Kolaborasi", icon: <Briefcase size={18} /> },
    { to: "/funder/profil", label: "Profil Brand", icon: <User size={18} /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  org: "Organisasi",
  funder: "Mitra Sponsor",
};

export function Sidebar({ role }: { role: Role }) {
  const { logout } = useActions();
  const { state, currentUser } = useStore();
  const support = useSupportEmail();
  const items = NAV[role];

  // Jumlah pengajuan baru yang perlu ditinjau mitra sponsor (untuk badge sidebar).
  const pendingPengajuan = useMemo(() => {
    if (role !== "funder" || !currentUser?.funderId) return 0;
    return state.pengajuan.filter(
      (p) => p.funderId === currentUser.funderId && p.status === "diajukan",
    ).length;
  }, [role, currentUser, state.pengajuan]);

  const badgeFor = (to: string) =>
    to === "/funder/pengajuan" && pendingPengajuan > 0 ? pendingPengajuan : 0;

  return (
    <aside className="sh-sidebar">
      <div className="sh-sidebar__brand">
        <BrandMark size={32} onDark />
      </div>

      <div className="sh-sidebar__group-label">{ROLE_LABEL[role]}</div>

      <nav className="sh-sidebar__nav" aria-label="Navigasi utama">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sh-sidebar__link${isActive ? " is-active" : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
            {badgeFor(item.to) > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  background: "var(--status-failed)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 999,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 5px",
                  lineHeight: 1,
                }}
              >
                {badgeFor(item.to)}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {role === "funder" && support && (
        <div className="dm-help">
          <div className="dm-help__title">
            <LifeBuoy size={16} />
            Butuh bantuan?
          </div>
          <p className="dm-help__text">
            Hubungi tim DealMatch kapan pun Anda membutuhkan bantuan.
          </p>
          <a
            className="sh-btn sh-btn--secondary sh-btn--sm"
            style={{ width: "100%", justifyContent: "center" }}
            href={`mailto:${support}`}
          >
            Hubungi Kami
            <ArrowUpRight size={14} />
          </a>
        </div>
      )}

      {currentUser && (
        <div className="sh-sidebar__footer">
          <button
            className="sh-btn sh-btn--secondary"
            style={{ width: "100%" }}
            onClick={logout}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      )}
    </aside>
  );
}
