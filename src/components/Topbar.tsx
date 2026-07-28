import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import { initials } from "@/lib/format";
import { NotificationsMenu } from "./NotificationsMenu";

const PROFILE_PATH: Record<string, string> = {
  admin: "/admin/pengaturan",
  org: "/org/profil",
  funder: "/funder/profil",
};

type Props = {
  title: string;
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
};

export function Topbar({ title, search }: Props) {
  const { state, currentUser } = useStore();
  const navigate = useNavigate();

  // Mitra sponsor: tampilkan nama brand + PIC (identitas yang dikenali lawan
  // bicara), bukan nama akun login. Peran lain tetap seperti semula.
  const funder =
    currentUser?.role === "funder"
      ? state.funders.find((f) => f.id === currentUser.funderId)
      : undefined;
  const displayName = funder?.name ?? currentUser?.name ?? "";
  const displaySub = funder
    ? funder.pic.name
      ? `PIC: ${funder.pic.name}`
      : "PIC belum diisi"
    : (currentUser?.email ?? "");

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
            onClick={() => navigate(PROFILE_PATH[currentUser.role])}
            title="Buka profil"
            style={{ background: "transparent", cursor: "pointer" }}
          >
            <span className="sh-avatar">
              {funder?.logoUrl ? (
                <img
                  src={funder.logoUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                />
              ) : (
                initials(displayName)
              )}
            </span>
            <div className="sh-user__meta">
              <span className="sh-user__name">{displayName}</span>
              <span className="sh-user__role">{displaySub}</span>
            </div>
          </button>
        )}
      </div>
    </header>
  );
}
