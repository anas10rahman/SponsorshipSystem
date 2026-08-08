import { Building2, Check, Users } from "lucide-react";
import { AUDIENCES } from "@/lib/landingContent";

const ICON = { org: Users, sponsor: Building2 };

export function ForWho() {
  return (
    <section id="untuk-siapa" className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <h2>Untuk Siapa?</h2>
        </div>

        <div className="lp-audience">
          {AUDIENCES.map((a, i) => {
            const Ic = ICON[a.side];
            return (
              <div
                key={a.side}
                className={`lp-aud lp-aud--${a.side}`}
                data-reveal
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="lp-aud__icon">
                  <Ic size={21} />
                </span>
                <h3>{a.title}</h3>
                <p className="lp-aud__who">{a.who}</p>
                <ul className="lp-aud__list">
                  {a.points.map((p) => (
                    <li key={p}>
                      <Check size={16} strokeWidth={3} aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
