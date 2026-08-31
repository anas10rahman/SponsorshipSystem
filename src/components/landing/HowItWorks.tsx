import { useState } from "react";
import { Building2, Users } from "lucide-react";
import { FLOWS } from "@/lib/landingContent";

const SIDES = [
  { key: "org", label: "Organizations", Icon: Users },
  { key: "sponsor", label: "Sponsor Partners", Icon: Building2 },
] as const;

type SideKey = (typeof SIDES)[number]["key"];

/** Alur kerja per peran, dipilih lewat dua tombol. Menampilkan satu alur
 *  saja membuat tiap langkah punya lebar penuh — pada tampilan dua kolom
 *  sebelumnya kedua sisi saling menyempitkan dan teksnya jadi rapat.
 *
 *  Titik milestone hidup di dalam baris grid yang sama dengan judulnya,
 *  dan garis penghubung digambar dari titik itu ke tepi bawah langkah.
 *  Keduanya karena itu tidak bisa melenceng betapa pun teksnya memanjang. */
export function HowItWorks() {
  const [active, setActive] = useState<SideKey>("org");

  return (
    <section id="cara-kerja" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head lp-sec__head--center" data-reveal>
          <h2>How DealMatch Works</h2>
        </div>

        <div className="lp-flowtabs" role="tablist" aria-label="Pilih peran" data-reveal>
          {SIDES.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`flowtab-${key}`}
              aria-selected={active === key}
              aria-controls={`flowpanel-${key}`}
              className={`lp-flowtabs__btn lp-flowtabs__btn--${key}${
                active === key ? " is-active" : ""
              }`}
              onClick={() => setActive(key)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* `key` pada panel memaksa React membuat ulang simpulnya saat peran
            ditukar, sehingga animasi masuk tiap langkah diputar lagi. */}
        <div className="lp-flows lp-flows--single">
          <div
            key={active}
            id={`flowpanel-${active}`}
            role="tabpanel"
            aria-labelledby={`flowtab-${active}`}
            className={`lp-flow lp-flow--${active}`}
          >
            <ol className="lp-flow__list">
              {FLOWS[active].map((step, i) => (
                <li
                  key={step.title}
                  className="lp-flow__step"
                  data-reveal
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <span className="lp-flow__marker" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="lp-flow__body">
                    <h3>{step.title}</h3>
                    <p>{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
