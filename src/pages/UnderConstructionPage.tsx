import { PublicLayout } from "@/components/landing/PublicLayout";
import { UnderConstruction } from "@/components/landing/UnderConstruction";

type Props = { title: string; blurb?: string };

/** Pembungkus halaman untuk menu publik yang isinya belum siap
 *  (Program, Gallery, Contact). */
export default function UnderConstructionPage({ title, blurb }: Props) {
  return (
    <PublicLayout>
      <UnderConstruction title={title} blurb={blurb} />
    </PublicLayout>
  );
}
