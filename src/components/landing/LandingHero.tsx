import { Link } from "react-router-dom";
import { Building2, Users } from "lucide-react";
import { MatchVisual } from "./visuals";

export function LandingHero() {
  return (
    <section className="lp-hero" id="beranda">
      <div className="lp-wrap lp-hero__grid">
        <div data-reveal className="is-in">
          <span className="lp-eyebrow">Platform Matching Sponsorship</span>

          <h1 className="lp-hero__title">
            Punya Event Keren tapi Bingung Cari{" "}
            <span className="lp-accent">Sponsor?</span>
          </h1>

          <p className="lp-hero__lead">
            Temukan match-mu di sini. Dapatkan sponsor yang relevan, jangkau
            audiens yang tepat, dan bangun kolaborasi bernilai — dalam satu
            platform.
          </p>

          <div className="lp-hero__ctas">
            <Link to="/register" className="lp-btn lp-btn--org">
              <Users size={17} /> Daftar sebagai Organisasi
            </Link>
            <Link to="/register" className="lp-btn lp-btn--ghost-sponsor">
              <Building2 size={17} /> Daftar sebagai Mitra Sponsor
            </Link>
          </div>

          <p className="lp-hero__note">
            // gratis untuk mendaftar &amp; membuat akun
          </p>
        </div>

        <div data-reveal className="is-in">
          <MatchVisual />
        </div>
      </div>
    </section>
  );
}
