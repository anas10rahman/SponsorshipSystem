# SponsorHub MVP

Static MVP aplikasi sponsorship berbasis role:

- Organisasi membuat dan mengelola pengajuan.
- Pendana melihat upcoming event dan menyetujui pendanaan.
- Admin mereview pengajuan, mengatur bagi hasil, dan memverifikasi transfer.

## Cara Menjalankan

Buka `index.html` langsung di browser, atau jalankan server lokal:

```sh
python3 -m http.server 5173
```

Lalu buka `http://localhost:5173`.

Data demo disimpan di `localStorage` browser dengan key `sponsorhub-state-v1`.

## Akun Demo

Semua akun memakai password dummy:

```text
Akundemo12345
```

- Admin: `Admin`
- Organisasi: `organisasi`
- Pendana: `pendana`

## Deploy Vercel

Project ini bisa dideploy sebagai static site di Vercel.

```sh
vercel --prod
```

## Database

Skema Postgres tersedia di `database/schema.sql`. Untuk deployment production, gunakan Neon Postgres dari Vercel Marketplace lalu isi environment variable `DATABASE_URL`.
