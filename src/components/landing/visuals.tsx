import type { CSSProperties } from "react";
import {
  Bell,
  Clock,
  Eye,
  FileText,
  Layers,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

/** Ikon yang dirujuk lewat nama string dari landingContent.ts. */
const ICONS = {
  shield: ShieldCheck,
  doc: FileText,
  clock: Clock,
  layers: Layers,
  revise: RefreshCw,
  lock: Lock,
  eye: Eye,
  bell: Bell,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 19 }: { name: IconName; size?: number }) {
  const Cmp = ICONS[name];
  return <Cmp size={size} strokeWidth={2} aria-hidden="true" />;
}

/** Cincin orbit yang berputar pelan di kartu "Paket sponsorship". */
export function OrbitRings() {
  return (
    <svg
      className="lp-orbit"
      width="220"
      height="220"
      viewBox="0 0 220 220"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="110" cy="110" rx="96" ry="34" stroke="rgba(255,255,255,.5)" />
      <ellipse
        cx="110"
        cy="110"
        rx="96"
        ry="34"
        stroke="rgba(255,255,255,.3)"
        transform="rotate(60 110 110)"
      />
      <circle cx="206" cy="110" r="5" fill="#fff" />
    </svg>
  );
}

/** Bar chart mini — tinggi tiap batang dibawa lewat CSS var `--h`
 *  supaya animasi tumbuhnya murni CSS saat kartu ter-reveal. */
export function MiniBars({ heights }: { heights: readonly number[] }) {
  return (
    <div className="lp-bars" aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="lp-bars__bar"
          style={
            { "--h": `${h}%`, transitionDelay: `${i * 110}ms` } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
