import { ProgramList } from "@/components/landing/ProgramList";
import { PublicLayout } from "@/components/landing/PublicLayout";

/** Halaman Program (/program) — daftar program DealMatch beserta
 *  poster dan tautan pendaftarannya. */
export default function ProgramPage() {
  return (
    <PublicLayout>
      <ProgramList />
    </PublicLayout>
  );
}
