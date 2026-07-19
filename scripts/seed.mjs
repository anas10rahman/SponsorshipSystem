// Seed data demo ke Neon (sepadan src/lib/seed.ts).
// Jalankan SETELAH db-setup. DATABASE_URL=... node scripts/seed.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diset.");
  process.exit(1);
}
const sql = neon(url);
const PW = "Akundemo12345";

// ---- Organisasi (org-1) ----
const [org] = await sql`
  insert into organizations
    (name, category, city, logo_initials, verified, legal_docs, payout_account, balance, phone,
     email, description, website, instagram, twitter, facebook,
     pic_name, pic_phone, pic_position, pic_email, pic_id_doc_url)
  values
    ('Yayasan Seni Budaya', 'Seni & Budaya', 'Jakarta', 'YS', true,
     ARRAY['akta-yayasan.pdf','skt-kemenkumham.pdf'], 'BCA 0123456789', 100000, '0812-3456-7890',
     'halo@yayasansenibudaya.org',
     'Yayasan nirlaba yang mewadahi seniman muda lewat festival, pameran, dan lokakarya seni budaya nusantara.',
     'yayasansenibudaya.org', '@senibudaya.id', '@senibudaya', 'YayasanSeniBudaya',
     'Rani Prameswari', '0812-3456-7890', 'Direktur Program', 'rani@yayasansenibudaya.org', 'ktp-rani-prameswari.pdf')
  returning id`;

// ---- Funders ----
const [f1] = await sql`
  insert into funders (name, type, focus, budget_total, budget_remaining, phone, email, description,
     website, instagram, twitter, facebook, pic_name, pic_phone, pic_position, pic_email)
  values ('Sinergi Nusantara', 'Korporasi', ARRAY['Teknologi','Edukasi'], 1000000000, 1000000000, '0815-1111-2222',
     'csr@sinerginusantara.co.id',
     'Perusahaan teknologi yang menjalankan program CSR di bidang pendidikan digital dan inovasi anak muda.',
     'sinerginusantara.co.id', '@sinergi.nusantara', '@sinerginusantara', 'SinergiNusantara',
     'Budi Santoso', '0815-1111-2222', 'Manajer CSR', 'budi@sinerginusantara.co.id')
  returning id`;

const [f2] = await sql`
  insert into funders (name, type, focus, budget_total, budget_remaining, phone, email, description,
     website, instagram, pic_name, pic_phone, pic_position, pic_email)
  values ('Yayasan Cahaya', 'Filantropi', ARRAY['Pendidikan','Kesehatan'], 500000000, 500000000, '0816-3333-4444',
     'kontak@yayasancahaya.org',
     'Yayasan filantropi yang mendukung program pendidikan dan kesehatan masyarakat prasejahtera.',
     'yayasancahaya.org', '@yayasancahaya', 'Sari Wijaya', '0816-3333-4444', 'Direktur Program', 'sari@yayasancahaya.org')
  returning id`;

const [f3] = await sql`
  insert into funders (name, type, focus, budget_total, budget_remaining, phone, email, description,
     website, instagram, twitter, facebook, pic_name, pic_phone, pic_position, pic_email)
  values ('Bank Daya', 'Perbankan', ARRAY['Olahraga','Komunitas'], 2000000000, 2000000000, '0817-5555-6666',
     'sponsorship@bankdaya.co.id',
     'Bank nasional dengan program sponsorship untuk olahraga dan kegiatan komunitas di seluruh Indonesia.',
     'bankdaya.co.id', '@bankdaya', '@bankdaya', 'BankDaya',
     'Andi Pratama', '0817-5555-6666', 'Head of Sponsorship', 'andi@bankdaya.co.id')
  returning id`;

// ---- Users (password di-hash via pgcrypto bcrypt) ----
await sql`
  insert into users (name, email, username, password_hash, role)
  values ('Maya Admin', 'admin@sponsorhub.test', 'Admin', crypt(${PW}, gen_salt('bf')), 'admin')`;
await sql`
  insert into users (name, email, username, password_hash, role, org_id)
  values ('Rani Prameswari', 'organisasi@sponsorhub.test', 'organisasi', crypt(${PW}, gen_salt('bf')), 'org', ${org.id})`;
await sql`
  insert into users (name, email, username, password_hash, role, funder_id)
  values ('Budi Santoso', 'sinergi@sponsorhub.test', 'sinergi', crypt(${PW}, gen_salt('bf')), 'funder', ${f1.id})`;
await sql`
  insert into users (name, email, username, password_hash, role, funder_id)
  values ('Sari Wijaya', 'cahaya@sponsorhub.test', 'cahaya', crypt(${PW}, gen_salt('bf')), 'funder', ${f2.id})`;
await sql`
  insert into users (name, email, username, password_hash, role, funder_id)
  values ('Andi Pratama', 'bankdaya@sponsorhub.test', 'bankdaya', crypt(${PW}, gen_salt('bf')), 'funder', ${f3.id})`;

console.log("✓ Seed selesai: 1 organisasi, 3 pendana (+akun login masing-masing), 5 akun login.");
