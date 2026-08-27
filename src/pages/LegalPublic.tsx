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
          The official text for this page is being drafted and will be
          published here once final.
        </p>
        <p>
          Something that cannot wait?{" "}
          <Link to="/about">Back to About Us</Link> and reach us through the
          channels listed there.
        </p>
      </div>
    </PublicLayout>
  );
}
