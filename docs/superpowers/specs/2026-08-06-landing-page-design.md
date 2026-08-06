# Landing page publik DealMatch

Tanggal: 6 Agustus 2026

## Masalah

`/` langsung me-redirect ke `/login`. Pengunjung yang membuka domain polos
mendarat di formulir login tanpa pernah tahu DealMatch itu apa. Dibutuhkan
halaman publik yang menjelaskan produk dan menyalurkan orang ke registrasi
atau login.

## Keputusan

### 1. Ditulis ulang di design system yang ada, bukan Tailwind

Referensi visual yang jadi titik awal ("moneyflow") ditulis dengan Tailwind +
`framer-motion` dan berpalet emerald. Project ini tidak memakai Tailwind maupun
shadcn — stylingnya CSS token (`colors_and_type.css` → `kit.css` →
`theme-dealmatch.css`). Yang diambil hanya **struktur dan layout**-nya; seluruh
tampilan ditulis ulang memakai token yang sudah ada dengan prefix `.lp-`.

Konsekuensi: nol dependency baru, dan landing page otomatis ikut berubah kalau
token brand diubah. Memasang Tailwind hanya untuk satu halaman akan
meninggalkan dua sistem styling paralel di repo yang sama.

### 2. Animasi CSS murni

Reveal saat scroll, orbit berputar, ripple, dan bar chart tumbuh semuanya
`@keyframes` + `transition`, dipicu satu `IntersectionObserver` kecil
(`useReveal`). `framer-motion` (~34KB gzip) tidak dipasang. Semua animasi mati
di bawah `prefers-reduced-motion: reduce`, dan elemen langsung ditandai tampil
supaya konten tidak pernah tersangkut tak terlihat.

### 3. Percabangan di `/` terjadi sebelum data ter-fetch

`session.userId` dibaca sinkron dari `localStorage` saat reducer diinisialisasi,
sedangkan `currentUser` baru terisi setelah daftar user datang dari server.
`RootEntry` karena itu bercabang pada `session.userId`, bukan `currentUser`:

- `session.userId` kosong → render `<Landing />` seketika, tanpa `HydrationGate`
- `session.userId` ada → `HydrationGate` → redirect ke dashboard sesuai peran

Kalau landing ikut dibungkus `HydrationGate`, pengunjung anonim akan melihat
layar "Memuat data…" lebih dulu — buruk untuk halaman pertama yang dilihat orang.

Route lain dipindah ke satu layout route ber-`<Outlet />` yang tetap dibungkus
`HydrationGate`, jadi perilakunya tidak berubah.

### 4. Halaman legal versi publik

Footer landing menautkan Kebijakan Privasi & Syarat Ketentuan. Versi yang sudah
ada (`/funder/...`) berada di balik `RoleGuard`, jadi pengunjung anonim akan
terlempar ke login. Ditambahkan route publik `/kebijakan-privasi` dan
`/syarat-ketentuan` yang merender `LegalPublic` — kerangka yang menunggu naskah
resmi — supaya footer tidak punya tautan mati.

### 5. Penempatan tombol Masuk

Tiga titik, dengan bobot visual berbeda supaya tidak bersaing dengan CTA daftar:

- **Nav kanan atas** — tautan teks polos (bukan tombol). Jangkar utama: tempat
  yang direfleks dicari, dan karena bukan tombol solid, ia tidak merebut
  perhatian dari "Daftar gratis" yang jadi satu-satunya tombol solid di nav.
- **Bawah CTA hero** — "Sudah punya akun? Masuk di sini", menangkap user lama
  tepat saat mereka berhenti membaca headline.
- **CTA penutup** — tombol kaca di samping "Daftar gratis", jaring pengaman.

### 6. Angka di hero masih placeholder

Keputusan pemilik project: pasang angka contoh sekarang, ganti belakangan.
Semuanya dikunci di satu blok bertanda di puncak `src/lib/landingContent.ts`
dengan penanda `TODO ANAS`, plus saklar `TAMPILKAN_ANGKA` untuk menyembunyikan
strip statistik seluruhnya bila belum ada angka yang layak dipajang.

Slot "trusted by" pada referensi tidak diisi logo perusahaan karangan,
melainkan tiga klaim proses yang benar apa adanya (verifikasi organisasi,
dokumen resmi terlampir, biaya pengajuan Rp 50.000).

## Struktur

```
src/pages/Landing.tsx              rangkai section
src/pages/LegalPublic.tsx          kerangka halaman legal publik
src/components/landing/
  LandingNav.tsx                   nav sticky + drawer mobile
  LandingHero.tsx                  headline, CTA, statistik, kartu
  HowItWorks.tsx                   4 langkah
  ForWho.tsx                       organisasi vs mitra sponsor
  Features.tsx                     6 fitur
  Faq.tsx                          accordion <details>
  FinalCta.tsx                     banner gradient
  LandingFooter.tsx                brand + tautan legal
  visuals.tsx                      orbit SVG, mini bar chart, peta ikon
  useReveal.ts                     IntersectionObserver
src/lib/landingContent.ts          seluruh naskah & angka
src/styles/landing.css             seluruh style .lp-*
```

Dimodifikasi: `src/App.tsx` (routing), `src/main.tsx` (import CSS).

## Verifikasi

- `npm run build` lolos; tidak ada dependency baru.
- Anonim buka `/` → landing tampil tanpa layar "Memuat data…".
- Login `Admin` → `/admin/dashboard`; buka `/` lagi → tetap ke dashboard,
  landing tidak muncul.
- `/login` dan `/register` tidak berubah perilakunya.
- Mobile 375px: tidak ada overflow horizontal, drawer berfungsi.
- Anchor nav mendarat 84px dari atas, tepat di bawah nav sticky setinggi 68px.

## Di luar cakupan

`src/pages/Login.tsx:18` memanggil `useState` di bawah early return, sehingga
setiap login sukses melempar "Rendered fewer hooks than expected". Bug ini sudah
ada sebelum pekerjaan ini dimulai dan sengaja tidak diperbaiki di sini supaya
perubahan tetap satu topik.
