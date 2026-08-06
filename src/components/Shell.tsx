import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import type { Role } from "@/lib/types";
import { Sidebar } from "./Sidebar";
import { MobileNavContext } from "./mobileNav";

export function Shell({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Tutup drawer setiap pindah halaman (mis. klik link di dalam drawer).
  useEffect(() => setOpen(false), [location.pathname]);

  // Kunci scroll body saat drawer mobile terbuka.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      <div className={`sh-shell${open ? " sh-shell--nav-open" : ""}`}>
        <Sidebar role={role} />
        <div className="sh-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
        <div className="sh-shell__main">
          <Outlet />
        </div>
      </div>
    </MobileNavContext.Provider>
  );
}
