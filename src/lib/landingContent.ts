/* ============================================================
   Naskah landing page — sumber: "DealMatch Compro.docx" +
   reference.html. Semua teks terpusat di sini supaya bisa
   diubah tanpa menyentuh komponen.

   Dua sisi platform dipetakan ke dua warna brand:
     Organisasi   → biru  (--dm-blue  #1E3A8A)
     Mitra Sponsor → hijau (--dm-green #10B981)
   Sama seperti logo DM: D biru dan M hijau disambung satu node.
   ============================================================ */

export const TAGLINE = "Two Sides. One Match.";

/* Navigasi publik — tiap butir halaman tersendiri (bukan anchor ke section). */
export const NAV_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/program", label: "Program" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
] as const;

/* ---------- Tentang Kami ---------- */

export const ABOUT_LEAD =
  "DealMatch menghubungkan Organisasi dengan Mitra Sponsor dalam satu platform yang lebih mudah, cepat, dan terarah.";

export const ABOUT_BODY =
  "Kami membantu Organisasi mengajukan proposal sponsorship dengan lebih mudah. Di sisi lain, DealMatch membantu Mitra Sponsor menemukan peluang kolaborasi yang sesuai dengan tujuan campaign dan target audiens.";

export const VALUE_PROPS = [
  {
    icon: "target",
    title: "Smart Matching",
    desc: "Tidak perlu lagi mengirim proposal secara acak. Incar mitra sponsor impianmu langsung.",
  },
  {
    icon: "grid",
    title: "One Platform",
    desc: "Seluruh proses sponsorship terintegrasi dalam satu platform, dari awal sampai deal.",
  },
  {
    icon: "eye",
    title: "Transparent Process",
    desc: "Pantau status proposal dan saldo secara real-time, tanpa tebak-tebakan.",
  },
  {
    icon: "sparkles",
    title: "Quality Connections",
    desc: "Kami hubungkan kamu dengan mitra sponsor yang benar-benar relevan dengan event-mu.",
  },
  {
    icon: "clock",
    title: "Save Time",
    desc: "Proses terstruktur dengan batas waktu respons yang jelas. Tidak perlu menunggu tanpa kepastian.",
  },
] as const;

/* ---------- Untuk Siapa ---------- */

export const AUDIENCES = [
  {
    side: "org",
    title: "Organisasi",
    who: "EO, Komunitas, BEM, HIMA, Karang Taruna, dan organisasi yang butuh support sponsor.",
    points: [
      "Temukan mitra sponsor yang paling relevan",
      "Ajukan proposal langsung, simpan sebagai draft, lanjutkan kapan saja",
      "Lacak status tiap pengajuan dari satu dasbor",
      "Dapatkan kepastian status: Disetujui, Perlu Revisi, atau Ditolak",
      "Bangun kolaborasi jangka panjang setelah proposal disetujui",
    ],
  },
  {
    side: "sponsor",
    title: "Mitra Sponsor",
    who: "Brand, perusahaan, dan mitra yang ingin menjangkau audiens lewat event dan peluang kolaborasi.",
    points: [
      "Terima proposal yang sudah terkurasi",
      "Tinjau detail acara secara lengkap",
      "Konfirmasi status proposal dalam satu klik",
      "Bangun eksposur ke komunitas yang tepat sasaran",
    ],
  },
] as const;

/* ---------- Cara Kerja (per peran) ---------- */

export const FLOWS = {
  org: [
    {
      title: "Daftar & Lengkapi Profil",
      desc: "Buat akun sebagai Organisasi, lengkapi profil dan dokumen legalitas.",
    },
    {
      title: "Verifikasi oleh Admin",
      desc: "Data dan dokumen ditinjau Admin untuk memastikan setiap akun memiliki informasi yang valid sebelum dapat menggunakan platform.",
    },
    {
      title: "Temukan Mitra Sponsor",
      desc: "Telusuri direktori Mitra Sponsor sesuai kebutuhan event, bidang yang didukung, dan peluang kolaborasi yang ditawarkan.",
    },
    {
      title: "Ajukan Proposal",
      desc: "Lengkapi informasi event, pilih atau susun paket sponsorship, unggah proposal PDF, lalu kirim pengajuan kepada Mitra Sponsor pilihanmu.",
    },
    {
      title: "Dapatkan Dukungan Sponsor",
      desc: "Mitra Sponsor meninjau pengajuan dan memberikan keputusan akhir proposal event.",
    },
  ],
  sponsor: [
    {
      title: "Daftar & Lengkapi Profil",
      desc: "Buat akun sebagai Mitra Sponsor, lengkapi profil dan dokumen legalitas.",
    },
    {
      title: "Verifikasi oleh Admin",
      desc: "Data dan dokumen ditinjau Admin untuk memastikan setiap akun memiliki informasi yang valid sebelum dapat menggunakan platform.",
    },
    {
      title: "Terima Proposal",
      desc: "Lihat proposal event yang masuk dan temukan peluang kolaborasi yang sesuai dengan target audiens.",
    },
    {
      title: "Tinjau Proposal",
      desc: "Pelajari detail event, target audiens, benefit sponsorship, paket yang ditawarkan, serta informasi pendukung lainnya.",
    },
    {
      title: "Tentukan Keputusan Kerjasama",
      desc: "Berikan keputusan terhadap proposal: Disetujui, Perlu Revisi, atau Ditolak.",
    },
  ],
} as const;

/* ---------- Ready to Match ---------- */

export const READY_CARDS = [
  {
    side: "org",
    title: "Sedang mencari sponsor?",
    desc: "Daftarkan organisasi kamu dan temukan mitra sponsor terbaik untuk event kamu.",
    cta: "Daftar sekarang",
  },
  {
    side: "sponsor",
    title: "Tertarik menjadi sponsor?",
    desc: "Daftarkan perusahaan atau brand kamu sebagai mitra sponsor terpercaya.",
    cta: "Daftar sekarang",
  },
] as const;

/* ---------- Rincian saldo (jawaban FAQ pertama) ---------- */

export const SALDO_ROWS = [
  {
    title: "Pengajuan dikirim",
    desc: "Dipotong saat proposal diajukan ke brand pilihan",
    amount: "− Rp50.000",
    tone: "minus",
  },
  {
    title: "Brand menyetujui",
    desc: "Kontak brand terbuka, biaya pengajuan resmi terpakai",
    amount: "Terpakai",
    tone: "neutral",
  },
  {
    title: "Brand menolak",
    desc: "Sebagian saldo dikembalikan otomatis ke akun kamu",
    amount: "+ Rp40.000",
    tone: "plus",
  },
  {
    title: "Tidak direspons > 7 hari",
    desc: "Dianggap kelalaian brand, bukan tanggung jawab kamu",
    amount: "+ Rp50.000",
    tone: "plus",
  },
] as const;

/* ---------- FAQ ---------- */

export const FAQ = [
  {
    q: "Apakah mendaftar dikenakan biaya?",
    a: "Mendaftar dan membuat akun gratis. Saat pengajuan dikenakan biaya dengan sistem saldo seperti berikut:",
    withSaldo: true,
  },
  {
    q: "Siapa yang bisa memulai pengajuan?",
    a: "Hanya organisasi. Mitra sponsor tidak menawarkan dana lebih dulu — mereka meninjau pengajuan yang masuk ke inbox, lalu memutuskan.",
  },
  {
    q: "Apakah keputusan sponsor bisa dianulir admin?",
    a: "Tidak. Persetujuan mitra sponsor bersifat final. Admin berperan memantau dan mencatat, bukan menyetujui atau membatalkan.",
  },
  {
    q: "Bagaimana cara verifikasi organisasi?",
    a: "Lengkapi profil organisasi beserta dokumen legalitas, lalu ajukan verifikasi dari halaman pengaturan. Admin akan meninjaunya.",
  },
  {
    q: "Apa yang terjadi kalau pengajuan diminta revisi?",
    a: "Pengajuan kembali ke organisasi untuk diperbaiki, lalu bisa dikirim ulang ke mitra sponsor yang sama tanpa biaya baru.",
  },
  {
    q: "Kenapa nomor telepon disembunyikan sebagian?",
    a: "Nomor penuh baru terbuka setelah ada pengajuan terkirim di antara kedua pihak, supaya koordinasi tetap tercatat di dalam sistem.",
  },
] as const;

/* ---------- Footer ---------- */

export const FOOTER_TAGLINE =
  "Platform yang mempertemukan Organisasi dan Mitra Sponsor — lebih mudah, cepat, dan terarah.";

export const FOOTER_COLUMNS = [
  {
    title: "Produk",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Program", href: "/program" },
      { label: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Untuk",
    links: [
      { label: "Organisasi", href: "/about" },
      { label: "Mitra Sponsor", href: "/about" },
    ],
  },
  {
    title: "Bantuan",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
      { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
    ],
  },
] as const;

/* ---------- Contact ----------
   Satu-satunya sumber data kontak publik. Halaman /contact tidak bisa
   membaca email admin dari store: halaman publik dirender tanpa sesi,
   dan /api/state memang tidak mengembalikan data untuk pengunjung anonim. */

/* TODO(anas): ganti dengan kontak DealMatch yang sebenarnya.
   `email` juga menjadi tujuan form penawaran kerja sama, jadi selama masih
   placeholder penawaran yang masuk tidak akan sampai ke siapa pun.

   `phone`/`whatsapp` sengaja DIKOSONGKAN, bukan diisi contoh: nomor karangan
   yang terlihat wajar bisa saja milik orang lain, dan halaman ini publik.
   Baris telepon otomatis disembunyikan selama kosong — isi keduanya untuk
   memunculkannya kembali. */
export const CONTACT_INFO = {
  email: "halo@dealmatch.id",
  phone: "",
  /** Dipakai untuk tautan wa.me — hanya angka, tanpa tanda baca. */
  whatsapp: "",
  address: "Jakarta, Indonesia",
  instagram: "@dealmatch.id",
  instagramUrl: "https://instagram.com/dealmatch.id",
} as const;

/** Pilihan subjek pada form penawaran kerja sama. `other` memunculkan
 *  isian bebas supaya penawaran di luar daftar tetap tertampung. */
export const CONTACT_SUBJECTS = [
  { value: "media-partner", label: "Media Partner" },
  { value: "co-branding", label: "Co-Branding / Co-Campaign" },
  { value: "community", label: "Community Collaboration" },
  { value: "other", label: "Lainnya…" },
] as const;
