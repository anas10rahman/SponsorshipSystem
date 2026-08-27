import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  /** Nama halaman, tampil sebagai judul kecil di atas pesan utama. */
  title: string;
  /** Satu kalimat tentang apa yang akan hadir di halaman ini. */
  blurb?: string;
};

/** Halaman placeholder untuk menu yang isinya belum siap.
 *
 *  Animasi murni CSS (tanpa framer-motion, mengikuti keputusan landing):
 *  simpul brand DM yang berdenyut dengan tiga satelit mengorbit — motif
 *  "dua sisi disambung satu node" yang sama dengan logo. Semua gerak mati
 *  otomatis saat pengguna meminta `prefers-reduced-motion`. */
export function UnderConstruction({ title, blurb }: Props) {
  return (
    <section className="lp-sec lp-uc">
      <div className="lp-wrap lp-uc__in">
        <div className="lp-uc__stage" aria-hidden="true">
          <span className="lp-uc__ring lp-uc__ring--1" />
          <span className="lp-uc__ring lp-uc__ring--2" />
          <span className="lp-uc__orbit">
            <span className="lp-uc__sat lp-uc__sat--a" />
            <span className="lp-uc__sat lp-uc__sat--b" />
            <span className="lp-uc__sat lp-uc__sat--c" />
          </span>
          <span className="lp-uc__core" />
        </div>

        <p className="lp-uc__eyebrow">{title}</p>
        <h1 className="lp-uc__title">This page is under construction</h1>
        <p className="lp-uc__blurb">
          {blurb ??
            "We are still putting this page together. In the meantime, explore the rest of DealMatch."}
        </p>

        <div className="lp-uc__bar" aria-hidden="true">
          <span />
        </div>

        <div className="lp-uc__actions">
          <Link to="/about" className="lp-btn lp-btn--org">
            <ArrowLeft size={16} />
            Back to About Us
          </Link>
          <Link to="/faq" className="lp-btn lp-btn--outline">
            View FAQ
          </Link>
        </div>
      </div>
    </section>
  );
}
