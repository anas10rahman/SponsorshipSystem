/* Migrasi AMAN: tambah kolom penghitung percobaan OTP ke tabel users.
   Jalankan: node scripts/migrate-otp-attempts.mjs
   (DATABASE_URL dibaca dari .env bila tidak diset di environment.)

   BEDA dengan scripts/db-setup.mjs — script itu MENGHAPUS seluruh schema
   (drop schema public cascade) dan hanya untuk bootstrap DB kosong.
   Script ini hanya menambah kolom: idempotent, tidak menyentuh data lama. */
import { readFileSync } from "node:fs";
import { Client } from "@neondatabase/serverless";

function dbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const m = env.match(/^\s*DATABASE_URL\s*=\s*(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    /* .env tidak ada — abaikan */
  }
  return null;
}

const url = dbUrl();
if (!url) {
  console.error("DATABASE_URL belum diset (env atau .env).");
  process.exit(1);
}

const client = new Client(url);
await client.connect();
try {
  const before = await client.query(
    `select count(*) as n from information_schema.columns
     where table_name = 'users' and column_name in ('reset_attempts','verify_attempts')`,
  );
  console.log(`Kolom terpasang sebelum migrasi: ${before.rows[0].n}/2`);

  await client.query(
    `alter table users add column if not exists reset_attempts  int not null default 0`,
  );
  await client.query(
    `alter table users add column if not exists verify_attempts int not null default 0`,
  );

  const after = await client.query(
    `select count(*) as n from information_schema.columns
     where table_name = 'users' and column_name in ('reset_attempts','verify_attempts')`,
  );
  const users = await client.query(`select count(*) as n from users`);
  console.log(`Kolom terpasang sesudah migrasi: ${after.rows[0].n}/2`);
  console.log(`Baris users utuh: ${users.rows[0].n}`);
  console.log(after.rows[0].n === "2" ? "✓ Migrasi selesai." : "✗ Migrasi belum lengkap.");
} finally {
  await client.end();
}
