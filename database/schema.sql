-- ============================================================
-- SponsorHub — Postgres schema (model PRD §6)
-- Bahasa: SQL. Komentar: Bahasa Indonesia.
-- Saat dipakai di Neon / Postgres, jalankan file ini sekali.
-- ============================================================

create extension if not exists pgcrypto;

-- =========== Enums (state machine sesuai PRD §6 & §7) ===========

create type user_role as enum ('admin', 'org', 'funder');

create type funder_type as enum ('Korporasi', 'Individu', 'Filantropi', 'Perbankan');

create type proposal_status as enum ('draf', 'aktif', 'tercapai', 'arsip');

-- State machine transaksi sukses: menunggu → diproses → disalurkan
-- Jalur tolak                  : menunggu → ditolak
create type transaction_status as enum ('menunggu', 'diproses', 'disalurkan', 'ditolak');

-- Pengajuan terarah (org → pendana spesifik).
-- Lifecycle: draf → diajukan → (perlu_revisi → diajukan)* → disetujui | ditolak.
-- Persetujuan pendana bersifat FINAL (admin hanya memantau).
create type pengajuan_status as enum (
  'draf', 'diajukan', 'perlu_revisi', 'disetujui', 'ditolak'
);

create type audit_action as enum (
  'transaksi.dibuat',
  'transaksi.diproses',
  'transaksi.disalurkan',
  'transaksi.ditolak',
  'proposal.dibuat',
  'proposal.diedit',
  'proposal.dipublikasi',
  'proposal.diarsip',
  'ajuan.dikirim',
  'akun.diverifikasi',
  'pengajuan.dibuat',
  'pengajuan.diajukan',
  'pengajuan.disetujui',
  'pengajuan.ditolak',
  'pengajuan.revisi'
);

create type audit_entity as enum ('transaksi', 'proposal', 'organisasi', 'pendana', 'ajuan', 'pengajuan');

create type notification_type as enum (
  'transaksi.menunggu',
  'transaksi.disalurkan',
  'transaksi.ditolak',
  'proposal.tercapai',
  'ajuan.diterima',
  'pengajuan.diajukan',
  'pengajuan.disetujui',
  'pengajuan.ditolak',
  'pengajuan.revisi',
  'verifikasi.diajukan',
  'verifikasi.disetujui',
  'verifikasi.ditolak'
);

-- Status verifikasi organisasi oleh admin (gate pengajuan)
create type org_verify_status as enum ('belum_diajukan', 'menunggu', 'terverifikasi', 'ditolak');

-- ============================================================
-- USERS
-- ============================================================
create table users (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null unique,
  username   text not null unique,
  password_hash text not null,                     -- bcrypt/argon2 di backend
  role       user_role not null,
  org_id     uuid,                                 -- ditautkan ke organizations
  funder_id  uuid,                                 -- ditautkan ke funders
  -- Verifikasi email (OTP): akun harus verifikasi sebelum bisa login
  email_verified boolean not null default false,
  verify_code    text,                             -- kode OTP di-hash (pgcrypto)
  verify_expires timestamptz,                      -- kadaluarsa kode OTP
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  category        text not null,
  city            text not null,
  logo_initials   text not null,                   -- contoh "YS"
  logo_url        text,                             -- logo organisasi (URL/base64), opsional
  verified        boolean not null default false,
  -- Verifikasi oleh admin (gate pengajuan); verified disinkron dgn status
  verification_status org_verify_status not null default 'belum_diajukan',
  verification_note   text,                          -- alasan bila ditolak
  legal_docs      text[] not null default '{}',    -- nama berkas / URL
  payout_account  text not null,                   -- contoh "BCA 0123456789"
  balance         numeric(16, 2) not null default 0 check (balance >= 0), -- saldo biaya pengajuan
  phone           text not null default '',         -- no.hp kontak (ber-gate ke lawan)
  -- Profil publik
  email           text not null default '',
  description     text not null default '',
  website         text,
  instagram       text,
  twitter         text,                              -- X (legacy)
  facebook        text,                              -- legacy
  tiktok          text,
  compro_url      text,                              -- Company profile (PDF) — wajib verifikasi
  -- Penanggung jawab (PIC)
  pic_name        text not null default '',
  pic_phone       text not null default '',          -- no.WA aktif PIC
  pic_position    text not null default '',
  pic_email       text not null default '',
  pic_id_doc_url  text not null default '',          -- KTP/KTM (PDF) — wajib di UI
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table users
  add constraint users_org_fk
  foreign key (org_id) references organizations(id) on delete set null;

-- ============================================================
-- FUNDERS (pendana)
-- ============================================================
create table funders (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  type              funder_type not null,
  focus             text[] not null default '{}',  -- kategori fokus pendanaan
  budget_total      numeric(16, 2) not null check (budget_total >= 0),
  budget_remaining  numeric(16, 2) not null check (budget_remaining >= 0),
  phone             text not null default '',       -- no.hp kontak (ber-gate ke lawan)
  -- Profil publik
  email             text not null default '',
  description       text not null default '',
  website           text,
  instagram         text,
  twitter           text,                            -- X
  facebook          text,
  logo_url          text,                            -- logo pendana (URL/base64), opsional
  -- Penanggung jawab (PIC)
  pic_name          text not null default '',
  pic_phone         text not null default '',        -- no.WA aktif PIC
  pic_position      text not null default '',
  pic_email         text not null default '',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint funders_budget_consistency check (budget_remaining <= budget_total)
);

alter table users
  add constraint users_funder_fk
  foreign key (funder_id) references funders(id) on delete set null;

-- ============================================================
-- PROPOSALS
-- ============================================================
create table proposals (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  title             text not null,
  category          text not null,
  city              text not null,
  description       text not null,
  benefits          text[] not null default '{}',
  target            numeric(16, 2) not null check (target > 0),
  raised            numeric(16, 2) not null default 0 check (raised >= 0),
  status            proposal_status not null default 'draf',
  proposal_doc_url  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- PRD §7: raised tidak boleh melebihi target
  constraint proposals_raised_lte_target check (raised <= target)
);

-- Many-to-many: proposal supporters (pendana yang mendukung)
create table proposal_supporters (
  proposal_id uuid not null references proposals(id) on delete cascade,
  funder_id   uuid not null references funders(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (proposal_id, funder_id)
);

-- ============================================================
-- TRANSACTIONS
-- ID format: TRX-YYYY-MMDD-XXXX (per PRD §6)
-- Disimpan sebagai text supaya cocok dengan format readable.
-- ============================================================
create table transactions (
  id               text primary key,
  proposal_id      uuid not null references proposals(id) on delete restrict,
  org_id           uuid not null references organizations(id) on delete restrict,
  funder_id        uuid not null references funders(id) on delete restrict,
  amount           numeric(16, 2) not null check (amount > 0),
  status           transaction_status not null default 'menunggu',
  note             text,
  created_at       timestamptz not null default now(),
  verified_by      uuid references users(id) on delete set null,
  verified_at      timestamptz,
  -- PRD §7: hanya Admin yang mengubah ke disalurkan/ditolak
  -- Konsistensi: status `disalurkan` wajib punya verified_by + verified_at
  constraint transactions_disalurkan_verified
    check (status <> 'disalurkan' or (verified_by is not null and verified_at is not null))
);

-- ============================================================
-- PENGAJUAN (terarah: Organisasi → Pendana spesifik)
-- Berisi informasi event + daftar paket sponsorship.
-- Pendana memilih SATU paket (selected_package) saat menyetujui.
-- ============================================================
create table pengajuan (
  id                text primary key,            -- PGJ-YYYY-MMDD-XXXX
  org_id            uuid not null references organizations(id) on delete cascade,
  funder_id         uuid not null references funders(id) on delete cascade,
  -- Informasi event
  event_name        text not null,
  event_location    text not null,
  event_date        text,
  description       text not null,
  event_budget      numeric(16, 2) not null default 0 check (event_budget >= 0),
  -- Detail sponsorship: array paket [{ name, requests[{type,amount,spec}], benefits[] }]
  packages          jsonb not null default '[]'::jsonb,
  selected_package  integer,                          -- index paket yang dipilih pendana
  -- Dokumen pendukung: array [{ name, data(base64) }] — bisa lebih dari satu
  documents         jsonb not null default '[]'::jsonb,
  proposal_doc_url  text,                              -- legacy: nama dokumen pertama
  proposal_doc_data text,                              -- legacy: isi dokumen tunggal
  extra_note        text,
  -- Lifecycle
  status            pengajuan_status not null default 'draf',
  revision_note     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Minimal satu paket saat sudah diajukan
  constraint pengajuan_has_package
    check (status = 'draf' or jsonb_array_length(packages) > 0)
);

-- Riwayat status pengajuan (timeline)
create table pengajuan_history (
  id            uuid primary key default gen_random_uuid(),
  pengajuan_id  text not null references pengajuan(id) on delete cascade,
  action        text not null,
  actor         text not null,                    -- "Organisasi" | "Pendana" | "Admin"
  note          text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- AUDIT LOGS (PRD §7: setiap perubahan status transaksi menulis log)
-- ============================================================
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references users(id) on delete set null,
  action      audit_action not null,
  entity      audit_entity not null,
  entity_id   text not null,                       -- text supaya bisa nampung TRX-... id
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  type        notification_type not null,
  message     text not null,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEX
-- ============================================================
create index proposals_status_idx          on proposals(status);
create index proposals_category_idx        on proposals(category);
create index proposals_org_idx             on proposals(org_id);
create index transactions_status_idx       on transactions(status);
create index transactions_org_idx          on transactions(org_id);
create index transactions_funder_idx       on transactions(funder_id);
create index transactions_proposal_idx     on transactions(proposal_id);
create index transactions_created_idx      on transactions(created_at desc);
create index pengajuan_funder_idx          on pengajuan(funder_id);
create index pengajuan_org_idx             on pengajuan(org_id);
create index pengajuan_status_idx          on pengajuan(status);
create index pengajuan_history_parent_idx  on pengajuan_history(pengajuan_id, created_at desc);
create index audit_logs_entity_idx         on audit_logs(entity, entity_id);
create index audit_logs_actor_idx          on audit_logs(actor_id);
create index notifications_user_unread_idx on notifications(user_id, read);

-- ============================================================
-- TRIGGER: updated_at otomatis
-- ============================================================
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_set_updated_at         before update on users         for each row execute function set_updated_at();
create trigger organizations_set_updated_at before update on organizations for each row execute function set_updated_at();
create trigger funders_set_updated_at       before update on funders       for each row execute function set_updated_at();
create trigger proposals_set_updated_at     before update on proposals     for each row execute function set_updated_at();
create trigger pengajuan_set_updated_at     before update on pengajuan     for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: auto-tercapai
-- PRD §7: saat raised >= target → status `tercapai`.
-- ============================================================
create or replace function proposals_auto_status()
returns trigger
language plpgsql
as $$
begin
  if new.raised >= new.target and new.status = 'aktif' then
    new.status := 'tercapai';
  end if;
  return new;
end;
$$;

create trigger proposals_status_check
  before insert or update of raised, target, status on proposals
  for each row execute function proposals_auto_status();

-- ============================================================
-- TRIGGER: setelah transaksi disalurkan, update raised proposal & sisa anggaran funder
-- Catatan: di backend Express/Prisma, ini lebih ideal dilakukan di service layer
-- untuk audit log eksplisit. Triger ini sebagai safety-net.
-- ============================================================
create or replace function transactions_apply_disbursement()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'disalurkan' and (old is null or old.status <> 'disalurkan') then
    update proposals
       set raised = raised + new.amount,
           updated_at = now()
     where id = new.proposal_id;
    update funders
       set budget_remaining = greatest(0, budget_remaining - new.amount),
           updated_at = now()
     where id = new.funder_id;
  end if;
  return new;
end;
$$;

create trigger transactions_after_status
  after insert or update of status on transactions
  for each row execute function transactions_apply_disbursement();

-- ============================================================
-- SEED DATA (opsional — sebanding dengan src/lib/seed.ts)
-- Aktifkan dengan blok di bawah jika diperlukan saat bootstrap dev DB.
-- ============================================================
-- Diabaikan secara default. Untuk testing, jalankan migrations/seed.ts terpisah.
