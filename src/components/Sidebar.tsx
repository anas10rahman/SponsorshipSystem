import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  Building2,
  Users,
  FileText,
  Settings,
  FolderKanban,
  Search,
  ReceiptText,
  Compass,
  Briefcase,
  LogOut,
  Send,
  Inbox,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { useActions, useStore } from "@/lib/store";

type Item = { to: string; label: string; icon: React.ReactNode };

const NAV: Record<Role, Item[]> = {
  admin: [
    { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/admin/transaksi", label: "Transaksi", icon: <ListChecks size={18} /> },
    { to: "/admin/pengajuan", label: "Pengajuan", icon: <Send size={18} /> },
    { to: "/admin/organisasi", label: "Organisasi", icon: <Building2 size={18} /> },
    { to: "/admin/pendana", label: "Pendana", icon: <Users size={18} /> },
    { to: "/admin/laporan", label: "Laporan", icon: <FileText size={18} /> },
    { to: "/admin/pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
  ],
  org: [
    { to: "/org/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { to: "/org/proposal", label: "Proposal saya", icon: <FolderKanban size={18} /> },
    { to: "/org/cari", label: "Cari pendana", icon: <Search size={18} /> },
    { to: "/org/pengajuan", label: "Pengajuan saya", icon: <Send size={18} /> },
    { to: "/org/topup", label: "Top-up saldo", icon: <Wallet size={18} /> },
    { to: "/org/transaksi", label: "Transaksi", icon: <ReceiptText size={18} /> },
    { to: "/org/pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
  ],
  funder: [
    { to: "/funder/jelajahi", label: "Jelajahi", icon: <Compass size={18} /> },
    { to: "/funder/pengajuan", label: "Pengajuan masuk", icon: <Inbox size={18} /> },
    { to: "/funder/portofolio", label: "Portofolio", icon: <Briefcase size={18} /> },
    { to: "/funder/transaksi", label: "Transaksi", icon: <ReceiptText size={18} /> },
    { to: "/funder/pengaturan", label: "Pengaturan", icon: <Settings size={18} /> },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  org: "Organisasi",
  funder: "Pendana",
};

export function Sidebar({ role }: { role: Role }) {
  const { logout } = useActions();
  const { currentUser } = useStore();
  const items = NAV[role];

  return (
    <aside className="sh-sidebar">
      <div className="sh-sidebar__brand">
        <BrandMark size={32} />
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
          </NavLink>
        ))}
      </nav>

      {currentUser && (
        <div className="sh-sidebar__footer">
          <span className="sh-avatar sh-avatar--sm">
            {currentUser.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 13,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {currentUser.name}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-500)" }}>
              {ROLE_LABEL[role]}
            </div>
          </div>
          <button
            className="sh-btn sh-btn--ghost sh-btn--icon"
            title="Keluar"
            aria-label="Keluar"
            onClick={logout}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
