import { Faq } from "@/components/landing/Faq";
import { PublicLayout } from "@/components/landing/PublicLayout";

/** Halaman FAQ tersendiri (/faq) — isinya dipindah dari landing satu-halaman. */
export default function FaqPage() {
  return (
    <PublicLayout>
      <Faq />
    </PublicLayout>
  );
}
