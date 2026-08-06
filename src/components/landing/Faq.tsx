import { FAQ } from "@/lib/landingContent";

/** Accordion pakai <details> bawaan browser — tetap bisa dibuka
 *  tanpa JavaScript dan sudah aksesibel secara default. */
export function Faq() {
  return (
    <section id="faq" className="lp-sec">
      <div className="lp-wrap">
        <div className="lp-sec__head" data-reveal>
          <div className="lp-lbl">FAQ</div>
          <h2 className="lp-sec__title">Pertanyaan yang sering muncul</h2>
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
              <p className="lp-faq__a">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
