import { useState } from "react";
import { FLOWS } from "@/lib/landingContent";

type Side = "org" | "sponsor";

const TABS: { side: Side; label: string }[] = [
  { side: "org", label: "Organisasi" },
  { side: "sponsor", label: "Mitra Sponsor" },
];

export function HowItWorks() {
  const [side, setSide] = useState<Side>("org");

  return (
    <section id="cara-kerja" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <span className="lp-eyebrow">Cara Kerja</span>
          <h2>Lima langkah, tanpa bolak-balik chat</h2>
          <p>
            Alurnya searah: organisasi yang mengajukan, mitra sponsor yang
            memutuskan.
          </p>
        </div>

        <div className="lp-tabs" role="tablist" aria-label="Pilih peran">
          {TABS.map((t) => (
            <button
              key={t.side}
              role="tab"
              data-side={t.side}
              aria-selected={side === t.side}
              className={`lp-tab${side === t.side ? " is-active" : ""}`}
              onClick={() => setSide(t.side)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="lp-timeline" data-side={side}>
          {FLOWS[side].map((step, i) => (
            <div
              key={`${side}-${step.title}`}
              className="lp-tl"
              data-reveal
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <div className="lp-tl__num">{i + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
