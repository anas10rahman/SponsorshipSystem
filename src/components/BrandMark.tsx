import type { CSSProperties } from "react";

type Props = {
  size?: number;
  showWordmark?: boolean;
  /** Latar gelap (mis. sidebar navy): logo diberi alas putih & wordmark diputihkan. */
  onDark?: boolean;
  style?: CSSProperties;
};

const BLUE = "#1E3A8A";
const GREEN = "#10B981";

export function BrandMark({ size = 32, showWordmark = true, onDark, style }: Props) {
  // Logo asli berwarna biru tua — di atas navy nyaris tak terlihat, jadi di
  // latar gelap dipasang pada alas putih membulat.
  const pad = onDark ? Math.round(size * 0.14) : 0;
  return (
    <span className="sh-row" style={{ gap: 10, alignItems: "center", ...style }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          padding: pad,
          borderRadius: onDark ? size / 4 : 0,
          background: onDark ? "#fff" : "transparent",
          flex: "none",
          boxSizing: "border-box",
        }}
      >
        <img
          src="/logo-mark.png"
          alt="DealMatch"
          width={size - pad * 2}
          height={size - pad * 2}
          style={{ display: "block", objectFit: "contain" }}
        />
      </span>
      {showWordmark && (
        <span style={{ fontWeight: 800, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          <span style={{ color: onDark ? "#FFFFFF" : BLUE }}>Deal</span>
          <span style={{ color: GREEN }}>Match</span>
        </span>
      )}
    </span>
  );
}
