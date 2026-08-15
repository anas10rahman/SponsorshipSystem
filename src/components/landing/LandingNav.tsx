import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { NAV_LINKS } from "@/lib/landingContent";

/** Nav landing yang menempel di atas. "Masuk" sengaja berupa tautan teks
 *  supaya "Daftar Sekarang" jadi satu-satunya tombol solid di nav. */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav__in">
        <Link to="/" aria-label="DealMatch — beranda">
          <BrandMark size={30} />
        </Link>

        <nav className="lp-nav__links">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.href}
              to={l.href}
              className={({ isActive }) => (isActive ? "is-active" : undefined)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="lp-nav__cta">
          <Link to="/login" className="lp-nav__masuk">
            Masuk
          </Link>
          <Link to="/register" className="lp-btn lp-btn--org lp-btn--sm">
            Daftar Sekarang
          </Link>
        </div>

        <button
          className="lp-nav__burger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Tutup menu" : "Buka menu"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`lp-drawer${open ? " is-open" : ""}`}>
        {NAV_LINKS.map((l) => (
          <NavLink
            key={l.href}
            to={l.href}
            className={({ isActive }) =>
              `lp-drawer__link${isActive ? " is-active" : ""}`
            }
            onClick={() => setOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <div className="lp-drawer__actions">
          <Link to="/register" className="lp-btn lp-btn--org">
            Daftar Sekarang
          </Link>
          <Link to="/login" className="lp-btn lp-btn--outline">
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
