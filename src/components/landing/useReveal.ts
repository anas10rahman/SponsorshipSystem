import { useEffect } from "react";

/**
 * Menambahkan class `is-in` ke setiap elemen ber-atribut `data-reveal`
 * begitu ia masuk viewport, supaya section landing muncul bertahap
 * tanpa perlu library animasi.
 *
 * Kalau pengguna minta gerak minimal atau browser tak punya
 * IntersectionObserver, semua elemen langsung ditandai tampil —
 * konten tidak pernah tersangkut tak terlihat.
 */
export function useReveal() {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!nodes.length) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
}
