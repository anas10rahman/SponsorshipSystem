import {
  ABOUT_BODY,
  ABOUT_LEAD,
  TAGLINE,
  VALUE_PROPS,
} from "@/lib/landingContent";
import { AboutDiagram, ValueIcon } from "./visuals";

export function About() {
  return (
    <section id="tentang" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-about">
          <div data-reveal>
            <AboutDiagram />
          </div>
          <div data-reveal>
            <span className="lp-eyebrow">Tentang DealMatch</span>
            <h2 className="lp-h2">{TAGLINE}</h2>
            <p className="lp-about__big" style={{ marginTop: 16 }}>
              {ABOUT_LEAD}
            </p>
            <p className="lp-about__sub">{ABOUT_BODY}</p>
          </div>
        </div>

        <div
          className="lp-sec__head"
          style={{ margin: "80px 0 40px" }}
          data-reveal
        >
          <span className="lp-eyebrow">Kenapa DealMatch</span>
          <h2>Kenapa harus memilih DealMatch?</h2>
        </div>

        <div className="lp-values">
          {VALUE_PROPS.map((v, i) => (
            <article
              key={v.title}
              className="lp-value"
              data-reveal
              style={{ animationDelay: `${(i % 3) * 70}ms` }}
            >
              <div className="lp-value__top">
                <span className="lp-value__icon">
                  <ValueIcon name={v.icon} />
                </span>
                {/* Referensi menaruh panah tautan di sudut ini. Kartu nilai
                    tidak menuju ke mana pun, jadi diisi nomor langkah —
                    menjaga keseimbangan sudutnya tanpa menjanjikan klik. */}
                <span className="lp-value__num">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </article>
          ))}

          <div className="lp-value lp-value--end" data-reveal>
            {TAGLINE}
          </div>
        </div>
      </div>
    </section>
  );
}
