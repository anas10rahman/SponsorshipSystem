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

/** Diagram kecil di section Tentang: Organisasi ─◆─ Mitra Sponsor. */
export function AboutDiagram() {
  return (
    <div className="lp-about__diagram" aria-hidden="true">
      <span className="lp-about__node lp-about__node--org">ORGANISASI</span>
      <span className="lp-about__arrow" />
      <span className="lp-about__node lp-about__node--sponsor">SPONSOR</span>
    </div>
  );
}
