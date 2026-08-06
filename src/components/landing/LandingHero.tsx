import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import {
  ANGKA_HERO,
  TAMPILKAN_ANGKA,
  TRUST_ITEMS,
} from "@/lib/landingContent";
import { Icon, MiniBars, OrbitRings } from "./visuals";

export function LandingHero() {
  return (
    <section className="lp-hero">
      <div className="lp-wrap lp-hero__grid">
        {/* --- Kiri: headline --- */}
        <div data-reveal className="is-in">
          <span className="lp-pill">
            <span className="lp-pill__dot" />
            Diawasi admin di tiap transaksi
          </span>

          <h1 className="lp-hero__title">
            Sponsorship yang jelas, dari <em>ajuan</em> sampai cair.
          </h1>

          <p className="lp-hero__lead">
            DealMatch menyatukan organisasi dan mitra sponsor dalam satu alur
            pengajuan yang terstruktur, terdokumentasi, dan bisa dilacak.
          </p>

          <div className="lp-hero__cta">
            <Link to="/register" className="lp-btn lp-btn--primary lp-btn--lg">
              Mulai gratis <ArrowUpRight size={16} />
            </Link>
            <a href="/#cara-kerja" className="lp-btn lp-btn--outline lp-btn--lg">
              Lihat cara kerja
            </a>
          </div>

          <p className="lp-hero__undercta">
            Sudah punya akun? <Link to="/login">Masuk di sini</Link>
          </p>

          {TAMPILKAN_ANGKA && (
            <div className="lp-stats">
              {ANGKA_HERO.map((s) => (
                <div key={s.label}>
                  <div className="lp-stats__val tabular">{s.value}</div>
                  <div className="lp-stats__lbl">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <div className="lp-trust">
            {TRUST_ITEMS.map((t) => (
              <span key={t.text}>
                <Icon name={t.icon} size={13} />
                {t.text}
              </span>
            ))}
          </div>
        </div>

        {/* --- Kanan: kartu --- */}
        <div className="lp-cards">
          <div className="lp-card lp-card--dark" data-reveal>
            <span className="lp-ripple" />
            <span className="lp-card__ic">
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <div className="lp-card__lbl">Pengawasan penuh</div>
              <div className="lp-card__txt">
                Setiap pengajuan
                <br />
                tercatat &amp; terpantau
              </div>
            </div>
          </div>

          <div className="lp-card lp-card--grad" data-reveal>
            <OrbitRings />
            <div>
              <div className="lp-card__lbl">Paket sponsorship</div>
              <div className="lp-card__txt">
                Susun beberapa
                <br />
                opsi sekaligus
              </div>
            </div>
          </div>

          <div className="lp-card lp-card--plain" data-reveal>
            <div className="lp-card__head">
              <div>
                <div className="lp-stats__lbl">Pendanaan disetujui</div>
                <div className="lp-card__amount tabular">Rp 48.500.000</div>
              </div>
              <span className="lp-card__delta">↑ 12,4%</span>
            </div>
            <MiniBars heights={[32, 54, 41, 78, 100]} />
          </div>
        </div>
      </div>
    </section>
  );
}
