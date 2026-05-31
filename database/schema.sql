create extension if not exists pgcrypto;

create type user_role as enum ('organisasi', 'pendana', 'admin');
create type sponsorship_type as enum ('in_cash', 'in_kind');
create type request_status as enum (
  'draft',
  'review_admin',
  'perlu_revisi',
  'ditolak',
  'terbuka',
  'ditinjau_pendana',
  'disetujui_pendana',
  'menunggu_transfer',
  'transfer_terverifikasi',
  'selesai'
);
create type decision_type as enum ('submit', 'approve', 'reject', 'request_revision', 'resubmit', 'set_terms', 'submit_transfer', 'verify_transfer');
create type transfer_status as enum ('belum_transfer', 'menunggu_verifikasi', 'terverifikasi', 'perlu_perbaikan');

create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role user_role not null,
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references users(id) on delete cascade,
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table funder_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  company_name text not null,
  preferred_categories text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sponsorship_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  event_date text not null,
  location text not null,
  category text not null,
  description text not null,
  sponsorship_type sponsorship_type not null default 'in_cash',
  total_budget numeric(14, 2) not null check (total_budget >= 0),
  requested_amount numeric(14, 2) not null check (requested_amount >= 0),
  proposed_revenue_share numeric(5, 2) not null default 0 check (proposed_revenue_share >= 0 and proposed_revenue_share <= 100),
  sponsor_benefits text[] not null default '{}',
  proposal_url text,
  status request_status not null default 'draft',
  selected_funder_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table review_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references sponsorship_requests(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  decision decision_type not null,
  from_status request_status,
  to_status request_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table funding_commitments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references sponsorship_requests(id) on delete cascade,
  funder_user_id uuid not null references users(id) on delete cascade,
  committed_amount numeric(14, 2) not null check (committed_amount >= 0),
  revenue_share numeric(5, 2) not null default 0 check (revenue_share >= 0 and revenue_share <= 100),
  status request_status not null default 'disetujui_pendana',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, funder_user_id)
);

create table transfer_records (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references sponsorship_requests(id) on delete cascade,
  funder_user_id uuid not null references users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount >= 0),
  reference_number text,
  proof_url text,
  status transfer_status not null default 'belum_transfer',
  verified_by_user_id uuid references users(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsorship_requests_status_idx on sponsorship_requests(status);
create index sponsorship_requests_category_idx on sponsorship_requests(category);
create index sponsorship_requests_organization_idx on sponsorship_requests(organization_id);
create index review_history_request_idx on review_history(request_id, created_at desc);
create index funding_commitments_funder_idx on funding_commitments(funder_user_id);
create index transfer_records_request_idx on transfer_records(request_id);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_set_updated_at before update on users for each row execute function set_updated_at();
create trigger organizations_set_updated_at before update on organizations for each row execute function set_updated_at();
create trigger funder_profiles_set_updated_at before update on funder_profiles for each row execute function set_updated_at();
create trigger sponsorship_requests_set_updated_at before update on sponsorship_requests for each row execute function set_updated_at();
create trigger funding_commitments_set_updated_at before update on funding_commitments for each row execute function set_updated_at();
create trigger transfer_records_set_updated_at before update on transfer_records for each row execute function set_updated_at();
