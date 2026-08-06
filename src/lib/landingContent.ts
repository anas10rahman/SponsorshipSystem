/* ============================================================
   Naskah landing page — semua teks & angka terpusat di sini
   supaya bisa diubah tanpa menyentuh komponen.
   ============================================================ */

/* ⚠️⚠️ TODO ANAS — ANGKA DI BAWAH MASIH CONTOH, BUKAN DATA NYATA ⚠️⚠️
   Ganti sebelum landing page dipromosikan ke calon pengguna.
   Kalau belum ada angka yang layak dipajang, set `TAMPILKAN_ANGKA = false`
   dan strip statistik di hero otomatis hilang tanpa menyisakan ruang kosong. */
export const TAMPILKAN_ANGKA = true;

export const ANGKA_HERO = [
  { value: "120+", label: "Organisasi terdaftar" },
  { value: "45+", label: "Mitra sponsor" },
  { value: "Rp 2,4 M", label: "Dana tersalurkan" },
] as const;
/* ⚠️⚠️ AKHIR BLOK ANGKA CONTOH ⚠️⚠️ */

/** Klaim faktual — aman dipajang karena semuanya benar apa adanya. */
export const TRUST_ITEMS = [
  { icon: "shield", text: "Verifikasi organisasi" },
  { icon: "doc", text: "Dokumen resmi terlampir" },
  { icon: "clock", text: "Biaya pengajuan Rp 50.000" },
] as const;

export const STEPS = [
  {
    title: "Daftar & verifikasi",
    desc: "Buat akun sebagai organisasi atau mitra sponsor, lengkapi profil dan dokumen legalitas.",
  },
  {
    title: "Cari mitra sponsor",
    desc: "Telusuri direktori mitra sponsor, lihat portofolio dan bidang yang mereka dukung.",
  },
  {
    title: "Susun pengajuan",
    desc: "Isi informasi event, rancang paket sponsorship, lampirkan proposal PDF, lalu kirim.",
  },
  {
    title: "Sponsor memutuskan",
    desc: "Mitra sponsor memilih paket lalu menyetujui, menolak, atau meminta revisi.",
  },
] as const;

export const FEATURES = [
  {
    icon: "layers",
    title: "Paket sponsorship",
    desc: "Tawarkan beberapa tingkat nominal beserta benefitnya dalam satu pengajuan.",
  },
  {
    icon: "doc",
    title: "Dokumen wajib",
    desc: "Proposal PDF ikut terkirim, jadi sponsor punya bahan lengkap untuk menilai.",
  },
  {
    icon: "revise",
    title: "Alur revisi",
    desc: "Sponsor bisa minta perbaikan tanpa harus menolak pengajuan dari awal.",
  },
  {
    icon: "lock",
    title: "Kontak ber-gate",
    desc: "Nomor telepon baru terbuka setelah ada pengajuan, koordinasi tetap di dalam sistem.",
  },
  {
    icon: "eye",
    title: "Pengawasan admin",
    desc: "Admin memantau setiap pengajuan dan transaksi yang berjalan di platform.",
  },
  {
    icon: "bell",
    title: "Notifikasi & laporan",
    desc: "Setiap perubahan status masuk notifikasi, rekapnya bisa diekspor.",
  },
] as const;

export const FAQ = [
  {
    q: "Apakah mendaftar dikenakan biaya?",
    a: "Mendaftar dan membuat akun gratis. Biaya Rp 50.000 hanya dikenakan saat Anda mengirim satu pengajuan ke mitra sponsor.",
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

export const ORG_BENEFITS = [
  "Ajukan ke mitra sponsor yang relevan, bukan sebar proposal acak",
  "Simpan sebagai draf, lanjutkan kapan saja",
  "Lacak status tiap pengajuan dari satu dasbor",
] as const;

export const FUNDER_BENEFITS = [
  "Pengajuan masuk rapi ke inbox, lengkap dengan dokumen",
  "Bandingkan paket sponsorship sebelum memutuskan",
  "Keputusan Anda final — tanpa perantara",
] as const;

/** Href diawali "/" supaya tautan ini juga bekerja dari halaman legal:
 *  dari landing ia cuma menggeser scroll (same-document), dari halaman lain
 *  ia kembali ke beranda lalu meloncat ke section yang dituju. */
export const NAV_LINKS = [
  { href: "/#cara-kerja", label: "Cara kerja" },
  { href: "/#untuk-siapa", label: "Untuk siapa" },
  { href: "/#fitur", label: "Fitur" },
  { href: "/#faq", label: "FAQ" },
] as const;
