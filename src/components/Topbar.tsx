import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/format";
import { NotificationsMenu } from "./NotificationsMenu";

const SETTINGS_PATH: Record<string, string> = {
  admin: "/admin/pengaturan",
  org: "/org/pengaturan",
  funder: "/funder/pengaturan",
};

type Props = {
  title: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
};

export function Topbar({ title, search }: Props) {
  const { currentUser } = useStore();
  const navigate = useNavigate();

  return (
    <header className="sh-topbar">
      <div className="sh-topbar__title">{title}</div>
      <div className="sh-topbar__spacer" />

      {search && (
        <div className="sh-topbar__search">
          <Search size={16} />
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Cari…"}
            aria-label="Pencarian"
          />
        </div>
      )}

      <div className="sh-topbar__actions">
        <NotificationsMenu />

        {currentUser && (
          <button
            type="button"
            className="sh-user"
            onClick={() => navigate(SETTINGS_PATH[currentUser.role])}
            title="Buka pengaturan profil"
            style={{ background: "transparent", cursor: "pointer" }}
          >
            <span className="sh-avatar">{initials(currentUser.name)}</span>
            <div className="sh-user__meta">
              <span className="sh-user__name">{currentUser.name}</span>
              <span className="sh-user__role">{currentUser.email}</span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
