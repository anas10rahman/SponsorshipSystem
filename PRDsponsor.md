# PRD — SponsorHub

> **Untuk agent (Claude Code):** Dokumen ini adalah sumber kebenaran untuk membangun
> aplikasi **SponsorHub**. Bangun bertahap sesuai Milestone (§13). Sebelum menulis UI,
> baca `SKILL.md`, `README.md`, dan `colors_and_type.css`, lalu **gunakan ulang** token
> & komponen dari `ui_kits/dashboard/`. Jangan menciptakan bahasa visual baru — ikuti
> design system yang sudah ada. Semua copy UI dalam **Bahasa Indonesia**.

---

## 1. Ringkasan Produk

SponsorHub adalah **platform sponsorship & pendanaan** yang menghubungkan organisasi
pencari dana dengan pendana (sponsor), dengan pengawasan administratif penuh atas
setiap transaksi. Target pasar: Indonesia.

**Tiga peran:**
| Peran | Tujuan utama |
|-------|--------------|
| **Admin** | Pemantau transaksi — verifikasi, awasi, dan settle setiap transaksi lintas platform. |
| **Organisasi** | Mencari pendana — buat proposal pendanaan dan cari sponsor. |
| **Pendana** | Pemberi dana — jelajahi proposal dan salurkan dana sponsor. |

**Loop inti:** Organisasi publikasi proposal → Pendana menyalurkan dana → Admin
memverifikasi & menyelesaikan transaksi.

## 2. Tujuan & Non-Tujuan

**Tujuan**
- Satu aplikasi web dengan 3 dashboard berbasis peran (RBAC).
- Alur proposal → pendanaan → verifikasi → pencairan yang transparan dan terlacak.
- Audit trail untuk setiap transaksi (siapa, kapan, berapa).

**Non-tujuan (rilis pertama)**
- Integrasi payment gateway sungguhan (gunakan simulasi/escrow dummy dulu).
- Aplikasi mobile native (web responsif cukup).
- Fitur chat real-time (cukup pengajuan + notifikasi).

## 3. Persona & Hak Akses

- **Admin** — internal SponsorHub. Akses penuh ke semua transaksi, organisasi, pendana,
  dan laporan. Satu-satunya yang bisa **memverifikasi** transaksi.
- **Organisasi** — akun terverifikasi (punya dokumen legal). Bisa CRUD proposal miliknya,
  mencari/menghubungi pendana, melihat transaksi miliknya. Tidak bisa lihat data
  organisasi lain.
- **Pendana** — korporasi/individu/filantropi. Bisa menjelajah proposal publik,
  menyalurkan dana, melihat portofolio & transaksi miliknya.

## 4. Alur Utama (User Flows)

**A. Organisasi membuat & mempublikasi proposal**
1. Login → Dashboard → "Buat proposal".
2. Isi judul, kategori, target dana (Rp), deskripsi, lampiran.
3. Simpan sebagai **draf** → tinjau → **Publikasikan**.
4. Proposal `aktif` muncul di katalog Pendana.

**B. Pendana menyalurkan dana**
1. Jelajahi proposal (filter kategori/lokasi) → buka detail.
2. "Salurkan dana" → masukkan jumlah → konfirmasi.
3. Sistem membuat **transaksi** berstatus `menunggu` (dana ditahan/escrow).
4. Proposal `raised` bertambah; pendana masuk ke daftar pendukung.

**C. Admin memverifikasi transaksi**
1. Dashboard Admin → tabel transaksi → filter `menunggu`.
2. Buka transaksi → tinjau detail → **Verifikasi & salurkan**.
3. Status → `disalurkan`; dana dirilis ke organisasi; tercatat di audit log.
4. Notifikasi ke organisasi & pendana.

**D. Organisasi mencari pendana**
1. Menu "Cari pendana" → cari berdasarkan nama/fokus/kapasitas.
2. "Ajukan" → kirim pesan singkat + tautkan proposal → pendana menerima notifikasi.

## 5. Fitur per Peran

### Admin
- KPI: total disalurkan, jumlah transaksi, menunggu verifikasi, organisasi aktif.
- Tabel transaksi dengan filter status + pencarian + aksi verifikasi.
- Direktori organisasi & pendana (lihat detail, status verifikasi akun).
- Laporan: ringkasan keuangan, ekspor CSV/PDF (boleh menyusul).
- Pengaturan platform: kelola peran, ambang verifikasi, notifikasi.

### Organisasi
- KPI: total terkumpul, proposal aktif, pendana terlibat, pencairan berikutnya.
- "Proposal saya": kartu dengan progress (terkumpul/target), status, jumlah pendana.
- Buat/edit/hapus proposal; publikasi & arsip.
- "Cari pendana": direktori + ajuan kerjasama.
- Riwayat transaksi milik organisasi.

### Pendana
- KPI: total disponsori, organisasi didanai, sisa kapasitas anggaran.
- "Jelajahi proposal": grid kartu + filter kategori.
- Salurkan dana (modal: jumlah + preset cepat + konfirmasi).
- Portofolio sponsor; riwayat penyaluran.

## 6. Model Data

```
User            { id, name, email, role: 'admin'|'org'|'funder', orgId?, funderId?, createdAt }
Organization    { id, name, category, city, logoInitials, verified, legalDocs[], payoutAccount }
Funder          { id, name, type: 'Korporasi'|'Individu'|'Filantropi'|'Perbankan',
                  focus[], budgetTotal, budgetRemaining }
Proposal        { id, orgId, title, category, description, target, raised,
                  status: 'draf'|'aktif'|'tercapai'|'arsip', supporters[], createdAt }
Transaction     { id (TRX-YYYY-MMDD-XXXX), proposalId, orgId, funderId, amount,
                  status: 'menunggu'|'diproses'|'disalurkan'|'ditolak',
                  createdAt, verifiedBy?, verifiedAt? }
Application     { id, orgId, funderId, proposalId?, message, status, createdAt }
AuditLog        { id, actorId, action, entity, entityId, meta, createdAt }
Notification    { id, userId, type, message, read, createdAt }
```

**State machine transaksi:** `menunggu → diproses → disalurkan` (jalur sukses) ·
`menunggu → ditolak` (oleh Admin). Hanya Admin yang mengubah ke `disalurkan`/`ditolak`.

## 7. Aturan Bisnis Penting

- Mata uang **Rupiah**, format `Rp 25.000.000` (titik ribuan, tanpa desimal).
- Penyaluran dana dari Pendana **menahan** (escrow) sampai Admin verifikasi.
- `raised` tidak boleh melebihi `target`; saat `raised >= target` → status `tercapai`.
- Hanya pemilik proposal (organisasi) yang bisa mengedit proposalnya.
- Setiap perubahan status transaksi menulis `AuditLog`.

## 8. Arsitektur & Tech Stack (rekomendasi)

- **Frontend:** React + Vite + TypeScript, React Router. Styling: CSS variables dari
  `colors_and_type.css` (atau Tailwind dengan token di-map ke variabel ini).
- **State/data:** TanStack Query untuk fetching; context untuk sesi/role.
- **Backend:** Node + Express (atau Next.js route handlers). DB: PostgreSQL + Prisma.
  Untuk prototipe boleh mock API / JSON server dulu.
- **Auth:** email+password, JWT/session, RBAC middleware per peran.
- **Ikon:** Lucide. **Font:** Plus Jakarta Sans + JetBrains Mono.

## 9. Daftar Halaman (Routes)

```
/login
/admin/dashboard   /admin/transaksi   /admin/organisasi   /admin/pendana   /admin/laporan   /admin/pengaturan
/org/dashboard     /org/proposal      /org/proposal/:id   /org/cari        /org/transaksi   /org/pengaturan
/funder/jelajahi   /funder/proposal/:id   /funder/portofolio   /funder/transaksi   /funder/pengaturan
```

## 10. Design System — WAJIB digunakan

File ada di root project ini:
- `colors_and_type.css` — impor pertama. Pakai token semantik: `--brand-500` (primary +
  Organisasi), `--navy-900`/`--role-admin` (Admin), `--green-500`/`--role-funder` (Pendana),
  `--status-success|pending|failed|info`, spacing/radii/shadow.
- `SKILL.md` & `README.md` — pedoman voice, casing, visual foundations, iconography.
- `assets/` — logo (`logo-wordmark.svg`, `logo-wordmark-light.svg`, `logo-mark.svg`).
- `ui_kits/dashboard/` — recreation interaktif 3 peran. **Gunakan ulang** komponen:
  `Sidebar`, `Topbar`, `RoleSwitcher`, `StatCard`, `StatusBadge`, `Button`, `ProposalCard`,
  `TransaksiTable`, `FunderList`, `OrgList`, `Modal`, `Field`, toast. `kit.css` berisi
  semua style komponen.

**Aturan visual ringkas:** kanvas putih, border hairline, shadow lembut bernuansa navy,
kartu radius 14px, transisi tenang 120–180ms, sentence case, tanpa emoji di UI, tanpa
gradient dekoratif. Tiga aksen peran membedakan permukaan Admin/Organisasi/Pendana.

## 11. Acceptance Criteria (contoh per epic)

**Auth & RBAC** — user login diarahkan ke dashboard sesuai perannya; akses route lintas
peran ditolak (403).
**Proposal** — Organisasi bisa buat draf, publikasi, edit; progress bar = `raised/target`;
status `tercapai` otomatis saat target tercapai.
**Pendanaan** — Pendana menyalurkan dana → transaksi `menunggu` dibuat; `raised` & sisa
kapasitas pendana ter-update; muncul toast konfirmasi.
**Verifikasi** — Admin memverifikasi transaksi `menunggu` → `disalurkan`; AuditLog tertulis;
notifikasi terkirim ke org & pendana.
**Format** — semua nominal `Rp 1.234.567`; tanggal `12 Mei 2026`; angka tabular sejajar.

## 12. Non-fungsional

- Responsif ≥ 1024px (dashboard); idealnya tetap pakai ≥ 768px.
- Aksesibilitas: kontras AA, fokus ring (`--ring`), target sentuh ≥ 40px.
- i18n-ready (string terpusat), default Bahasa Indonesia.

## 13. Milestone untuk Claude Code

1. **Setup** — scaffold Vite+TS+Router; impor `colors_and_type.css`; port `kit.css`
   & komponen UI kit ke `src/components/`.
2. **Auth + shell** — login, RBAC, `Sidebar`/`Topbar`/`RoleSwitcher`, routing per peran.
3. **Admin** — dashboard KPI, tabel transaksi + filter, alur verifikasi + AuditLog.
4. **Organisasi** — dashboard, CRUD proposal, cari pendana + ajuan, riwayat transaksi.
5. **Pendana** — jelajahi + filter, alur salurkan dana, portofolio, riwayat.
6. **Data layer** — Prisma schema (model §6), seed data, API + validasi aturan bisnis (§7).
7. **Polish** — notifikasi, laporan/ekspor, empty states, loading states, responsif.

## 14. Cara menjalankan PRD ini di Claude Code

1. Taruh folder design system ini di root repo (atau sebagai folder `design-system/`).
2. Beri prompt ke Claude Code: _"Baca PRD.md dan SKILL.md. Mulai dari Milestone 1.
   Gunakan ulang token & komponen dari design system, jangan bikin gaya baru."_
3. Kerjakan per milestone; setelah tiap milestone, minta Claude verifikasi acceptance
   criteria terkait sebelum lanjut.

---

> **Catatan:** Brand (logo, warna, tipografi) saat ini orisinal hasil rancangan untuk
> brief ini. Jika ada aset resmi SponsorHub, ganti di `assets/` dan sesuaikan token di
> `colors_and_type.css` — sisa sistem akan ikut menyesuaikan.
