import { CalendarDays, Clock, Wallet, ArrowUpRight, Check } from "lucide-react";
import { PROGRAMS } from "@/lib/landingContent";

/** Daftar program DealMatch. Poster ditampilkan utuh di sisi kiri kartu,
 *  detail dan tombol daftar di kanan; pada layar sempit keduanya menumpuk.
 *  Tombol daftar menuju formulir pendaftaran eksternal. */
export function ProgramList() {
  return (
    <section className="lp-sec lp-program">
      <div className="lp-wrap">
        {/* Judul & deskripsi sengaja tidak ditampilkan — halaman langsung ke
            kartu program. h1 tetap ada untuk pembaca layar dan mesin telusur. */}
        <h1 className="lp-sr-only">Program DealMatch</h1>

        <div className="lp-program__list">
          {PROGRAMS.map((p) => (
            <article key={p.id} className="lp-program__card" data-reveal>
              <a
                className="lp-program__poster"
                href={p.ctaUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Daftar program ${p.title}`}
              >
                <img src={p.poster} alt={`Poster program ${p.title}`} loading="lazy" />
              </a>

              <div className="lp-program__body">
                <span className="lp-program__tag">{p.category}</span>
                <h2 className="lp-program__title">{p.title}</h2>

                <dl className="lp-program__meta">
                  <div>
                    <dt>
                      <CalendarDays size={16} />
                      Tanggal
                    </dt>
                    <dd>{p.date}</dd>
                  </div>
                  <div>
                    <dt>
                      <Clock size={16} />
                      Waktu
                    </dt>
                    <dd>{p.time}</dd>
                  </div>
                  <div>
                    <dt>
                      <Wallet size={16} />
                      Investasi
                    </dt>
                    <dd>{p.price}</dd>
                  </div>
                </dl>

                <ul className="lp-program__points">
                  {p.highlights.map((h) => (
                    <li key={h}>
                      <Check size={16} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>

                <div className="lp-program__speakers">
                  <h3>Pembicara</h3>
                  {p.speakers.map((s) => (
                    <div key={s.name} className="lp-program__speaker">
                      <strong>{s.name}</strong>
                      <span>{s.role}</span>
                    </div>
                  ))}
                </div>

                <a
                  className="lp-btn lp-btn--org lp-program__cta"
                  href={p.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {p.ctaLabel}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
