import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/landing/PublicLayout";

type Props = { title: string };

/** Kerangka halaman legal versi publik — dipakai tautan footer landing.
 *  Versi di dalam Shell (`/funder/...`) ada di balik RoleGuard, jadi tidak
 *  bisa dipakai pengunjung yang belum login. Naskah resmi menyusul. */
export default function LegalPublic({ title }: Props) {
  return (
    <PublicLayout>
      <div className="lp-legal">
        <h1>{title}</h1>
        <p>
          Naskah resmi halaman ini sedang disusun dan akan dipublikasikan di
          sini begitu final.
        </p>
        <p>
          Ada pertanyaan yang tidak bisa menunggu?{" "}
          <Link to="/about">Kembali ke About Us</Link> dan hubungi kami lewat
          kanal yang tersedia.
        </p>
      </div>
    </PublicLayout>
  );
}
