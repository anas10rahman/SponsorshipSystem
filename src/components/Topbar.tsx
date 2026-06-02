import { Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/format";
import { NotificationsMenu } from "./NotificationsMenu";

type Props = {
  title: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
};

export function Topbar({ title, search }: Props) {
  const { currentUser } = useStore();

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
          <div className="sh-user">
            <span className="sh-avatar">{initials(currentUser.name)}</span>
            <div className="sh-user__meta">
              <span className="sh-user__name">{currentUser.name}</span>
              <span className="sh-user__role">{currentUser.email}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
