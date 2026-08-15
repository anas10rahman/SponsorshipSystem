import { useEffect, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";
import { useReveal } from "./useReveal";

/** Kerangka bersama semua halaman publik (About Us, Program, Gallery,
 *  Contact, FAQ, legal): nav atas + isi + footer.
 *
 *  Menerima `children` maupun `<Outlet />` supaya bisa dipakai dua cara —
 *  langsung membungkus halaman, atau sebagai layout route. */
export function PublicLayout({ children }: { children?: ReactNode }) {
  const { pathname } = useLocation();
  useReveal();

  // Pindah halaman harus mulai dari atas: tanpa ini, berpindah dari bagian
  // bawah satu halaman ke halaman lain mendarat di tengah-tengah isi.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="lp">
      <LandingNav />
      <main>{children ?? <Outlet />}</main>
      <LandingFooter />
    </div>
  );
}
