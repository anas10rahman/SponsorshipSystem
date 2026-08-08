import { Link } from "react-router-dom";
import { ArrowRight, Building2, Users } from "lucide-react";
import { READY_CARDS } from "@/lib/landingContent";

const ICON = { org: Users, sponsor: Building2 };

export function ReadyToMatch() {
  return (
    <section className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-sec__head lp-sec__head--center" data-reveal>
          <span className="lp-eyebrow">Ready to Match?</span>
          <h2>Pilih sisi kamu, mulai hari ini</h2>
        </div>

        <div className="lp-ready">
          {READY_CARDS.map((c, i) => {
            const Ic = ICON[c.side];
            return (
              <div
                key={c.side}
                className={`lp-ready__card lp-ready__card--${c.side}`}
                data-reveal
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="lp-ready__glow" aria-hidden="true" />
                <span className="lp-ready__icon">
                  <Ic size={21} />
                </span>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <Link
                  to="/register"
                  className={`lp-btn lp-btn--${c.side === "org" ? "org" : "sponsor"}`}
                >
                  {c.cta} <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
