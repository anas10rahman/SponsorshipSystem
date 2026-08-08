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

/** Visual tanda tangan hero: dua sisi bertemu di satu titik.
 *  Garis putus-putus biru datang dari sisi Organisasi, hijau dari sisi
 *  Mitra Sponsor, keduanya mengalir ke node DealMatch di tengah —
 *  bentuk yang sama dengan logo DM. */
export function MatchVisual() {
  return (
    <div className="lp-match" aria-hidden="true">
      <svg
        className="lp-match__svg"
        viewBox="0 0 440 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Cincin redup di sekitar titik temu */}
        <circle cx="220" cy="210" r="70" stroke="var(--line)" />
        <circle cx="220" cy="210" r="112" stroke="var(--line-soft)" />
        <circle cx="220" cy="210" r="158" stroke="var(--line-soft)" />

        {/* Organisasi → tengah */}
        <path
          className="lp-dash lp-dash--org"
          d="M78 108 C 132 132, 156 168, 196 196"
        />
        {/* Mitra Sponsor → tengah */}
        <path
          className="lp-dash lp-dash--sponsor"
          d="M372 318 C 320 296, 292 262, 250 226"
        />

        <circle className="lp-pulse" cx="78" cy="108" r="5" fill="var(--dm-blue)" />
        <circle
          className="lp-pulse"
          cx="372"
          cy="318"
          r="5"
          fill="var(--dm-green)"
          style={{ animationDelay: "1.2s" }}
        />
      </svg>

      <span className="lp-match__node lp-match__node--org">Organisasi</span>
      <span className="lp-match__node lp-match__node--center">DealMatch</span>
      <span className="lp-match__node lp-match__node--sponsor">
        Mitra Sponsor
      </span>
    </div>
  );
}

/** Logo DealMatch sebagai visual section Tentang. Lambangnya sendiri sudah
 *  menyatakan "Two Sides. One Match." — D biru dan M hijau disambung satu
 *  node — jadi lebih kuat daripada diagram abstrak yang mengulang hal sama. */
export function AboutDiagram() {
  return (
    <div className="lp-about__diagram">
      <img
        src="/logo-mark.png"
        alt="Logo DealMatch"
        className="lp-about__logo"
        width={180}
        height={180}
      />
    </div>
  );
}
