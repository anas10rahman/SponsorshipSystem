import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { FUNDER_BENEFITS, ORG_BENEFITS } from "@/lib/landingContent";

function Benefits({ items }: { items: readonly string[] }) {
  return (
    <ul className="lp-who__list">
      {items.map((t) => (
        <li key={t}>
          <span className="lp-tick">
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

export function ForWho() {
  return (
    <section id="untuk-siapa" className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <div className="lp-lbl">Untuk siapa</div>
          <h2 className="lp-sec__title">Dua sisi, satu meja yang sama</h2>
        </div>

        <div className="lp-who">
          <div className="lp-who__card" data-reveal>
            <h3>Organisasi</h3>
            <p className="lp-who__desc">
              Panitia event, komunitas, BEM, dan organisasi yang butuh
              pendanaan.
            </p>
            <Benefits items={ORG_BENEFITS} />
            <Link
              to="/register"
              className="lp-btn lp-btn--primary lp-who__cta"
            >
              Daftar sebagai organisasi
            </Link>
          </div>

          <div
            className="lp-who__card lp-who__card--dark"
            data-reveal
            style={{ transitionDelay: "90ms" }}
          >
            <h3>Mitra sponsor</h3>
            <p className="lp-who__desc">
              Perusahaan dan brand yang ingin menyalurkan dana secara terarah.
            </p>
            <Benefits items={FUNDER_BENEFITS} />
            <Link to="/register" className="lp-btn lp-btn--white lp-who__cta">
              Daftar sebagai mitra sponsor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
