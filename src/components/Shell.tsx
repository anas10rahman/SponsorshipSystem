import { Outlet } from "react-router-dom";
import type { Role } from "@/lib/types";
import { Sidebar } from "./Sidebar";

export function Shell({ role }: { role: Role }) {
  return (
    <div className="sh-shell">
      <Sidebar role={role} />
      <div className="sh-shell__main">
        <Outlet />
      </div>
    </div>
  );
}
