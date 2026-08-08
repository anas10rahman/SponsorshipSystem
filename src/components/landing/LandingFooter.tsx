import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";
import {
  FOOTER_COLUMNS,
  FOOTER_TAGLINE,
  TAGLINE,
} from "@/lib/landingContent";

/** Tautan internal pakai <Link>, anchor ke section pakai <a> biasa
 *  supaya dari halaman legal ia kembali ke beranda lalu meloncat. */
function FooterLink({ href, label }: { href: string; label: string }) {
  return href.startsWith("/#") ? (
    <a href={href}>{label}</a>
  ) : (
    <Link to={href}>{label}</Link>
  );
}

export function LandingFooter() {
  return (
    <footer className="lp-foot">
      <div className="lp-wrap">
        <div className="lp-foot__grid">
          <div>
            <BrandMark size={28} />
            <p className="lp-foot__tagline">{FOOTER_TAGLINE}</p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lp-foot__col">
              <h4>{col.title}</h4>
              {col.links.map((l) => (
                <FooterLink key={col.title + l.label} {...l} />
              ))}
            </div>
          ))}
        </div>

        <div className="lp-foot__bar">
          <span>© {new Date().getFullYear()} DealMatch. All rights reserved.</span>
          <span className="lp-mono">{TAGLINE}</span>
        </div>
      </div>
    </footer>
  );
}
