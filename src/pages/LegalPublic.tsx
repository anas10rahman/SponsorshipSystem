import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

type Props = { title: string };

/** Kerangka halaman legal versi publik — dipakai tautan footer landing.
 *  Versi di dalam Shell (`/funder/...`) ada di balik RoleGuard, jadi tidak
 *  bisa dipakai pengunjung yang belum login. Naskah resmi menyusul. */
export default function LegalPublic({ title }: Props) {
  return (
    <div className="lp">
      <LandingNav />
      <main className="lp-legal">
        <h1>{title}</h1>
        <p>
          Naskah resmi halaman ini sedang disusun dan akan dipublikasikan di
          sini begitu final.
        </p>
        <p>
          Ada pertanyaan yang tidak bisa menunggu?{" "}
          <Link to="/">Kembali ke beranda</Link> dan hubungi kami lewat kanal
          yang tersedia.
        </p>
      </main>
      <LandingFooter />
    </div>
  );
}
