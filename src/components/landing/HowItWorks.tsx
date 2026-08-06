import { STEPS } from "@/lib/landingContent";

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <div className="lp-lbl">Cara kerja</div>
          <h2 className="lp-sec__title">Empat langkah, tanpa bolak-balik chat</h2>
          <p className="lp-sec__sub">
            Alurnya searah: organisasi yang mengajukan, mitra sponsor yang
            memutuskan.
          </p>
        </div>

        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="lp-step"
              data-reveal
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="lp-step__n">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
