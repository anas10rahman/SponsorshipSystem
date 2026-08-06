import { FEATURES } from "@/lib/landingContent";
import { Icon } from "./visuals";

export function Features() {
  return (
    <section id="fitur" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <div className="lp-lbl">Fitur</div>
          <h2 className="lp-sec__title">Yang bikin prosesnya nggak berantakan</h2>
        </div>

        <div className="lp-feats">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="lp-feat"
              data-reveal
              style={{ transitionDelay: `${(i % 3) * 80}ms` }}
            >
              <div className="lp-feat__ic">
                <Icon name={f.icon} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
