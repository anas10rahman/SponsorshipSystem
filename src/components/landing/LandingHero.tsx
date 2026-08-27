import { useEffect, useState } from "react";

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
      <div className="lp-wrap">
        <div data-reveal className="is-in lp-hero__inner">
          {/* Kata berputar dibiarkan selebar isinya, jadi "together" ikut
              bergeser — mengunci lebar ke kata terpanjang menyisakan celah
              kosong untuk kata pendek. `key` yang berubah me-mount ulang
              span sehingga animasi masuknya terputar lagi. */}
          <h1
            className="lp-hero__title"
            aria-label={`Where sponsors and organizations ${ROTATING[0]} together`}
          >
            <span aria-hidden="true">
              Where sponsors and organizations
              <br />
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
      </div>
    </section>
  );
}
