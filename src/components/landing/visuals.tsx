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

/** Ilustrasi section Tentang: dua sisi — Sponsor Partner dan Organization —
 *  bertemu di DealMatch. Menggantikan logo polos karena gambar ini
 *  menceritakan hubungannya, bukan cuma menampilkan lambangnya. */
export function AboutDiagram() {
  return (
    <div className="lp-about__diagram">
      <img
        src="/about-dealmatch.jpg"
        alt="Sponsor Partner dan Organization bertemu di DealMatch"
        className="lp-about__art"
        width={1400}
        height={933}
        loading="lazy"
      />
    </div>
  );
}
