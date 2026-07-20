import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Info } from "lucide-react";
import { useActions, useStore } from "@/lib/store";
import { formatDateTime } from "@/lib/format";

export function NotificationsMenu() {
  const { state, currentUser } = useStore();
  const { markNotificationRead } = useActions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      state.notifications
        .filter((n) => currentUser && n.userId === currentUser.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 12),
    [state.notifications, currentUser],
  );

  const unread = items.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAll = () => {
    items.filter((n) => !n.read).forEach((n) => markNotificationRead(n.id));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="sh-btn sh-btn--ghost sh-btn--icon"
        aria-label={`Notifikasi${unread ? ` (${unread} belum dibaca)` : ""}`}
        title={currentUser?.role === "funder" ? "Ke Pengajuan masuk" : "Notifikasi"}
        onClick={() => {
          // Pendana: bell langsung menuju halaman Pengajuan masuk.
          if (currentUser?.role === "funder") {
            navigate("/funder/pengajuan");
            return;
          }
          setOpen((v) => !v);
        }}
        style={{ position: "relative" }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "var(--status-failed)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              minWidth: 16,
              height: 16,
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 360,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-3)",
            maxHeight: 480,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 50,
          }}
          role="menu"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <strong>Notifikasi</strong>
            {unread > 0 && (
              <button
                className="sh-btn sh-btn--ghost sh-btn--sm"
                onClick={markAll}
                title="Tandai semua telah dibaca"
              >
                <CheckCheck size={14} />
                Tandai dibaca
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {items.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--ink-500)",
                }}
              >
                <Info size={20} style={{ margin: "0 auto 8px" }} />
                <div>Belum ada notifikasi.</div>
              </div>
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.map((n) => (
                  <li
                    key={n.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--line-soft)",
                      background: n.read ? "transparent" : "var(--brand-50)",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (!n.read) markNotificationRead(n.id);
                    }}
                  >
                    <div style={{ fontSize: 14, color: "var(--ink-900)" }}>
                      {n.message}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-500)",
                        marginTop: 4,
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{formatDateTime(n.createdAt)}</span>
                      {!n.read && (
                        <span
                          style={{
                            color: "var(--brand-600)",
                            fontWeight: 700,
                          }}
                        >
                          Baru
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
