import { Clock, Eye, LayoutGrid, Sparkles, Target } from "lucide-react";

/** Ikon nilai, dirujuk lewat nama string dari landingContent.ts.
 *  Sengaja pakai Lucide yang sudah terpasang, bukan gambar dari CDN luar
 *  seperti di referensi — kalau CDN-nya mati, kartunya ikut kosong. */
const VALUE_ICONS = {
  target: Target,
  grid: LayoutGrid,
  eye: Eye,
  sparkles: Sparkles,
  clock: Clock,
} as const;

export type ValueIconName = keyof typeof VALUE_ICONS;

export function ValueIcon({ name }: { name: ValueIconName }) {
  const Cmp = VALUE_ICONS[name];
  return <Cmp size={20} strokeWidth={2} aria-hidden="true" />;
}

/** Logo DealMatch sebagai visual section Tentang. Lambangnya sendiri sudah
 *  menyatakan "Two Sides. One Match." — D biru dan M hijau disambung satu
 *  node — jadi lebih kuat daripada diagram abstrak yang mengulang hal sama. */
export function AboutDiagram() {
  return (
    <div className="lp-about__diagram">
      <img
        src="/logo-mark.png"
        alt="DealMatch logo"
        className="lp-about__logo"
        width={180}
        height={180}
      />
    </div>
  );
}
