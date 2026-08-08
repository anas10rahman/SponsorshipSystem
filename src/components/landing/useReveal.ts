import { useEffect } from "react";

/** Dipasang di <html> hanya setelah hook ini hidup. Aturan `opacity: 0`
 *  di landing.css bergantung padanya, jadi kalau JS gagal dimuat halaman
 *  tetap tampil penuh alih-alih kosong sama sekali. */
const ENABLE_CLASS = "lp-reveal-on";

/**
 * Menambahkan class `is-in` ke setiap elemen ber-atribut `data-reveal`
 * begitu ia masuk viewport, supaya section landing muncul bertahap
 * tanpa perlu library animasi.
 *
 * Elemen yang baru muncul belakangan — mis. timeline "Cara kerja" saat
 * tab perannya ditukar — ikut terpantau lewat MutationObserver, karena
 * menitipkan tanggung jawab itu ke tiap pemanggil terbukti mudah lupa.
 *
 * Pemindaian ulang aman: query menyaring `:not(.is-in)`, dan `observe()`
 * atas elemen yang sudah diamati tidak berefek. MutationObserver sengaja
 * hanya menyimak `childList`, bukan atribut, supaya penambahan class
 * `is-in` tidak memicu dirinya sendiri.
 *
 * Kalau pengguna minta gerak minimal atau browser tak punya
 * IntersectionObserver, semua elemen langsung ditandai tampil.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(ENABLE_CLASS);

    const pending = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)"),
      );

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      const revealAll = () => pending().forEach((n) => n.classList.add("is-in"));
      revealAll();
      const mo = new MutationObserver(revealAll);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => {
        mo.disconnect();
        root.classList.remove(ENABLE_CLASS);
      };
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

    const scan = () => pending().forEach((n) => io.observe(n));
    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove(ENABLE_CLASS);
    };
  }, []);
}
