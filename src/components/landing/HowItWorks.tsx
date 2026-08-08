import { Building2, Users } from "lucide-react";
import { FLOWS } from "@/lib/landingContent";

const SIDES = [
  { key: "org", label: "Organisasi", Icon: Users },
  { key: "sponsor", label: "Mitra Sponsor", Icon: Building2 },
] as const;

/** Dua alur ditampilkan berdampingan: Organisasi di sisi kiri, Mitra
 *  Sponsor di sisi kanan, relnya masing-masing menempel ke tepi luar
 *  sehingga teks kedua sisi mengalir ke tengah.
 *
 *  Titik milestone hidup di dalam baris grid yang sama dengan judulnya,
 *  dan garis penghubung digambar dari titik itu ke tepi bawah langkah.
 *  Keduanya karena itu tidak bisa melenceng betapa pun teksnya memanjang —
 *  masalah yang muncul kalau kurva digambar terpisah dari tata letaknya. */
export function HowItWorks() {
  return (
    <section id="cara-kerja" className="lp-sec lp-sec--alt">
      <div className="lp-wrap">
        <div className="lp-sec__head lp-sec__head--center" data-reveal>
          <h2>Cara DealMatch Bekerja</h2>
        </div>

        <div className="lp-flows">
          {SIDES.map(({ key, label, Icon }) => (
            <div key={key} className={`lp-flow lp-flow--${key}`}>
              <div className="lp-flow__head" data-reveal>
                <span className="lp-flow__badge">
                  <Icon size={18} />
                </span>
                {label}
              </div>

              <ol className="lp-flow__list">
                {FLOWS[key].map((step, i) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}
