import type { CSSProperties } from "react";

type Props = {
  size?: number;
  showWordmark?: boolean;
  style?: CSSProperties;
};

export function BrandMark({ size = 32, showWordmark = true, style }: Props) {
  return (
    <span
      className="sh-row"
      style={{ gap: 10, alignItems: "center", ...style }}
    >
      <span
        className="sh-sidebar__mark"
        style={{ width: size, height: size, borderRadius: size / 4 }}
      >
        S
      </span>
      {showWordmark && (
        <span style={{ fontWeight: 800, letterSpacing: "-0.01em" }}>
          SponsorHub
        </span>
      )}
    </span>
  );
}
