import type { CSSProperties } from "react";

type Props = {
  size?: number;
  showWordmark?: boolean;
  /** Latar gelap (mis. sidebar navy): biru tua ditukar putih agar tetap terbaca. */
  onDark?: boolean;
  style?: CSSProperties;
};

const BLUE = "#1E3A8A";
const GREEN = "#10B981";

/** Monogram D•M DealMatch — huruf D, simpul penghubung, lalu huruf M. */
function Mark({ size, onDark }: { size: number; onDark?: boolean }) {
  // Di atas navy gelap, #1E3A8A nyaris tak terlihat → pakai putih.
  const blue = onDark ? "#FFFFFF" : BLUE;
  return (
    <svg
      viewBox="0 0 96 64"
      height={size}
      width={(size * 96) / 64}
      fill="none"
      role="img"
      aria-label="DealMatch"
      style={{ flex: "none" }}
    >
      <path
        fill={blue}
        fillRule="evenodd"
        d="M4 6h15a26 26 0 0 1 0 52H4V6Zm13 11v30h2a15 15 0 0 0 0-30h-2Z"
      />
      <circle cx="27" cy="32" r="5.5" fill={blue} />
      <path d="M27 32h23" stroke={GREEN} strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="50" cy="32" r="5.5" fill={GREEN} />
      <path
        d="M64 57V25l11 14 11-14v32"
        stroke={GREEN}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandMark({ size = 32, showWordmark = true, onDark, style }: Props) {
  return (
    <span className="sh-row" style={{ gap: 10, alignItems: "center", ...style }}>
      <Mark size={size} onDark={onDark} />
      {showWordmark && (
        <span style={{ fontWeight: 800, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          <span style={{ color: onDark ? "#FFFFFF" : BLUE }}>Deal</span>
          <span style={{ color: GREEN }}>Match</span>
        </span>
      )}
    </span>
  );
}
