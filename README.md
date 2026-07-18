# SponsorHub

Platform sponsorship & pendanaan dengan tiga peran (Admin, Organisasi, Pendana) dan pengawasan administratif penuh atas setiap transaksi. Spesifikasi: lihat [`PRDsponsor.md`](./PRDsponsor.md).

## Tech stack

- **Frontend:** React 18 + Vite + TypeScript + React Router
- **State:** Reducer + React Context, persistensi `localStorage`
- **Ikon:** Lucide
- **Font:** Plus Jakarta Sans + JetBrains Mono (dimuat via Google Fonts)
- **Design system:** `src/styles/colors_and_type.css` (token) + `src/styles/kit.css` (komponen)

> Rilis pertama belum memakai backend. Schema PostgreSQL tetap disimpan di `database/schema.sql` untuk Milestone 6 (Data layer).

## Menjalankan lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Akun demo

Kata sandi: `Akundemo12345`

| Peran      | Username      |
| ---------- | ------------- |
| Admin      | `Admin`       |
| Organisasi | `organisasi`  |
| Pendana    | `pendana`     |

Data tersimpan di `localStorage` (key `sponsorhub-state-v2`). Hapus key tersebut untuk reset.

## Struktur folder

```
src/
  components/   # Sidebar, Topbar, StatCard, StatusBadge, …
  lib/          # types, store, format, seed
  pages/
    admin/      # /admin/*
    org/        # /org/*
    funder/     # /funder/*
    Login.tsx
    Placeholder.tsx
  styles/
    colors_and_type.css
    kit.css
public/
  logo-mark.svg
database/
  schema.sql    # untuk Milestone 6
```

## Alur sponsorship (Plan 2 — org-initiated only)

Hanya **organisasi** yang dapat menginisiasi pendanaan. Pendana tidak menawarkan/menyalurkan
dana sendiri — mereka hanya meninjau pengajuan yang masuk.

**Pengajuan terarah:** Organisasi pilih pendana spesifik di "Cari pendana" → isi form multi-step
(informasi event → paket sponsorship [nama, nominal, detail permintaan, benefit] → dokumen PDF
wajib → review) → bayar biaya pengajuan Rp 50.000 → kirim ke inbox pendana → Pendana memilih
salah satu paket lalu **setujui / tolak / minta revisi**.
Persetujuan pendana bersifat **final**; Admin hanya memantau (`/admin/pengajuan`, laporan,
direktori). Bisa disimpan sebagai draf dan dilanjutkan.

**Kontak ber-gate:** organisasi & pendana saling melihat no.hp di profil, tapi nomor penuh baru
terbuka **setelah ada pengajuan terkirim** di antara mereka (sebelumnya di-mask). Admin selalu
melihat. Tujuannya menjaga koordinasi tetap di dalam sistem.

> Catatan: model katalog publik (`Proposal`/`Transaction`) masih ada di data-layer sebagai kode
> dorman bila suatu saat ingin mengaktifkan kembali alur pendana-menyalurkan-dana (Plan 1).

## Milestone

Lihat PRD §13. Per milestone selesai → verifikasi acceptance criteria (§11) sebelum lanjut.

1. Setup ✅
2. Auth + shell + RBAC ✅
3. Admin ✅
4. Organisasi ✅
5. Pendana ✅
6. Data layer (refactor schema, backend opsional) ✅
7. Polish (notifikasi, ekspor, empty/loading states) ✅
8. Pengajuan terarah (Org → Pendana, paket sponsorship, alur revisi) ✅

## Deploy Vercel

```bash
vercel --prod
```

Vite project, build output di `dist/`. Konfigurasi rewrites untuk SPA ada di `vercel.json`.
