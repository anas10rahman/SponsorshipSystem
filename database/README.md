# Skema Database SponsorHub

Skema ini disiapkan untuk Postgres, direkomendasikan memakai Neon Postgres dari Vercel Marketplace.

## Tabel Utama

- `users`: akun aplikasi dengan role `organisasi`, `pendana`, atau `admin`.
- `organizations`: profil organisasi pembuat pengajuan.
- `funder_profiles`: profil perusahaan/pendana.
- `sponsorship_requests`: data utama pengajuan sponsorship.
- `review_history`: timeline audit untuk semua perubahan status.
- `funding_commitments`: komitmen pendanaan dan skema bagi hasil.
- `transfer_records`: bukti transfer dan status verifikasi admin.

## Cara Pakai di Neon/Postgres

1. Buat database Postgres.
2. Jalankan isi `schema.sql`.
3. Simpan `DATABASE_URL` di Vercel Environment Variables.

MVP frontend saat ini masih memakai `localStorage`; skema ini adalah fondasi untuk migrasi backend/API berikutnya.
