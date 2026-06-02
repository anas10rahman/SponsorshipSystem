# SponsorHub — Database

Schema PostgreSQL sesuai PRD §6 (model: User, Organization, Funder, Proposal, Transaction, Application, AuditLog, Notification).

## Menjalankan

```bash
# Lokal: pakai container Postgres atau install lokal
createdb sponsorhub
psql sponsorhub < schema.sql
```

Atau di [Neon](https://neon.tech) (rekomendasi PRD §8): buat project baru, jalankan `schema.sql` di SQL Editor, lalu set `DATABASE_URL` di Vercel.

## Highlight desain

- **Enum status terpusat** — `transaction_status`, `proposal_status` sesuai PRD §6.
- **Trigger `proposals_auto_status`** — mengubah `aktif` → `tercapai` ketika `raised >= target` (PRD §7).
- **Trigger `transactions_apply_disbursement`** — saat transaksi → `disalurkan`, otomatis:
  - tambah `raised` di proposal terkait,
  - kurangi `budget_remaining` di pendana.
  Sebagai safety-net. Backend tetap sebaiknya menulis `audit_logs` eksplisit.
- **Konsistensi check** — `transactions_disalurkan_verified` memastikan setiap transaksi `disalurkan` wajib punya `verified_by` + `verified_at`.
- **ID transaksi text** — format readable `TRX-YYYY-MMDD-XXXX` (PRD §6), bukan UUID.
- **JSONB `meta` di audit log** — fleksibel untuk menyimpan konteks bebas (amount, status sebelum/sesudah, dll).

## Mapping ke frontend store

`src/lib/types.ts` di frontend memakai struktur yang sama (camelCase). Saat backend siap, mapping snake_case ↔ camelCase dilakukan di layer API (atau pakai Prisma model dengan `@map`).

## Migrasi & seed

Untuk rilis pertama, skema dipakai sebagai blueprint — backend belum dibangun. Frontend pakai localStorage (lihat `src/lib/store.tsx`).

Saat backend dibangun (Milestone berikutnya), gunakan Prisma:

```bash
npx prisma init
# tulis ulang sebagai prisma/schema.prisma berdasarkan schema.sql ini
npx prisma migrate dev
```
