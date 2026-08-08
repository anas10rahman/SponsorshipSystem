import { MatchVisual } from "./visuals";

export function LandingHero() {
  return (
    <section className="lp-hero" id="beranda">
      <div className="lp-wrap lp-hero__grid">
        <div data-reveal className="is-in">
          <h1 className="lp-hero__title">
            Punya Event Keren tapi Bingung Cari{" "}
            <span className="lp-accent">Sponsor?</span>
          </h1>

          <p className="lp-hero__lead">
            Temukan match-mu di sini!
            <br />
            Dapatkan sponsor yang relevan, jangkau audiens yang tepat, dan
            bangun kolaborasi bernilai dalam satu platform.
          </p>
        </div>

        <div data-reveal className="is-in">
          <MatchVisual />
        </div>
      </div>
    </section>
  );
}
