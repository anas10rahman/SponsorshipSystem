import { Link } from "react-router-dom";
import { Building2, Users } from "lucide-react";
import { FAQ } from "@/lib/landingContent";
import { SaldoTable } from "./SaldoTable";

/** Accordion pakai <details> bawaan browser — tetap bisa dibuka
 *  tanpa JavaScript dan sudah aksesibel secara default. */
export function Faq() {
  return (
    <section id="faq" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <span className="lp-eyebrow">FAQ</span>
          <h2>Pertanyaan yang sering muncul</h2>
        </div>

        <div className="lp-faq">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              className="lp-faq__item"
              open={i === 0}
              data-reveal
            >
              <summary>
                {item.q}
                <span className="lp-faq__sign" aria-hidden="true">
                  +
                </span>
              </summary>
              <div className="lp-faq__a">
                {item.a}
                {"withSaldo" in item && item.withSaldo && <SaldoTable />}
              </div>
            </details>
          ))}
        </div>

        <div className="lp-outro" data-reveal>
          <h2>Masih ada yang mau ditanyakan?</h2>
          <p>
            Tim kami siap bantu kamu mulai perjalanan sponsorship pertamamu di
            DealMatch.
          </p>
          <div className="lp-outro__ctas">
            <Link to="/register" className="lp-btn lp-btn--org">
              <Users size={17} /> Daftar sebagai Organisasi
            </Link>
            <Link to="/register" className="lp-btn lp-btn--ghost-sponsor">
              <Building2 size={17} /> Daftar sebagai Mitra Sponsor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
