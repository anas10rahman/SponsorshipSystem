import { Link } from "react-router-dom";

export function FinalCta() {
  return (
    <div className="lp-wrap">
      <section className="lp-final" data-reveal>
        <span
          className="lp-final__ring"
          style={{ width: 420, height: 420 }}
          aria-hidden="true"
        />
        <span
          className="lp-final__ring"
          style={{ width: 600, height: 600 }}
          aria-hidden="true"
        />
        <div className="lp-final__in">
          <h2>Siap mengajukan sponsorship pertama?</h2>
          <p>
            Buat akun gratis hari ini. Tidak ada biaya sampai Anda benar-benar
            mengirim pengajuan.
          </p>
          <div className="lp-final__cta">
            <Link to="/register" className="lp-btn lp-btn--white lp-btn--lg">
              Daftar gratis
            </Link>
            <Link to="/login" className="lp-btn lp-btn--glass lp-btn--lg">
              Masuk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
