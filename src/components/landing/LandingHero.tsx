import { useEffect, useState } from "react";
import { MatchVisual } from "./visuals";

const ROTATING = ["connect", "collaborate", "grow", "succeed"];
const EVERY_MS = 2200;

export function LandingHero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setI((n) => (n + 1) % ROTATING.length),
      EVERY_MS,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section className="lp-hero" id="beranda">
      <div className="lp-wrap lp-hero__grid">
        <div data-reveal className="is-in">
          {/* Kata berputar dibiarkan selebar isinya, bukan dikunci ke kata
              terpanjang — kotak tetap menyisakan celah 70-an px di depan
              "together" untuk kata pendek. Ekornya ikut bergeser, sama
              seperti referensi. `key` yang berubah me-mount ulang span
              sehingga animasi masuknya terputar lagi. */}
          <h1
            className="lp-hero__title"
            aria-label={`Where sponsors and organizations ${ROTATING[0]} together`}
          >
            <span aria-hidden="true">
              Where sponsors and organizations{" "}
              <span className="lp-rotate">
                <span className="lp-rotate__dot" />
                <span key={i} className="lp-rotate__word">
                  {ROTATING[i]}
                </span>
              </span>{" "}
              together
            </span>
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
