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
      </div>
    </section>
  );
}
