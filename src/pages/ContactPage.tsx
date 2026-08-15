import { ContactPartnership } from "@/components/landing/ContactPartnership";
import { PublicLayout } from "@/components/landing/PublicLayout";

/** Halaman Contact (/contact) — tanpa hero, langsung informasi kontak
 *  DealMatch dan form penawaran kerja sama. */
export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactPartnership />
    </PublicLayout>
  );
}
