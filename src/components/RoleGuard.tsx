import { Navigate, useLocation } from "react-router-dom";
import { type ReactNode, useEffect } from "react";
import { rolePath, useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

type Props = {
  allow: Role;
  children: ReactNode;
};

/**
 * Gate yang:
 * - Belum login → /login
 * - Role mismatch → redirect ke dashboard role miliknya (alih-alih 403)
 * - Sambil dipasang, set body[data-role] supaya token --role-* aktif.
 */
export function RoleGuard({ allow, children }: Props) {
  const { currentUser } = useStore();
  const location = useLocation();

  useEffect(() => {
    document.body.dataset.role = allow;
    return () => {
      delete document.body.dataset.role;
    };
  }, [allow]);

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (currentUser.role !== allow) {
    return <Navigate to={rolePath[currentUser.role]} replace />;
  }
  return <>{children}</>;
}
