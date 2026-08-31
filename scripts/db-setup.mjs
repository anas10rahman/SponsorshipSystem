// Bootstrap skema Neon Postgres — MENGHAPUS SELURUH ISI DATABASE lalu
// membuat ulang dari database/schema.sql. Hanya untuk DB kosong / awal.
//
// ⚠️ BUKAN untuk migrasi DB berisi data: semua user, organisasi, pengajuan,
//    saldo, dan dokumen akan HILANG PERMANEN.
//    Untuk menambah kolom pada DB yang sudah jalan, tulis script ALTER TABLE
//    tersendiri (contoh: scripts/migrate-otp-attempts.mjs).
//
// Jalankan: DATABASE_URL=... CONFIRM_WIPE=yes node scripts/db-setup.mjs
import { readFileSync } from "node:fs";
import { Client } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diset.");
  process.exit(1);
}

// Pagar keselamatan: penghapusan total tidak boleh terjadi karena salah ketik.
if (process.env.CONFIRM_WIPE !== "yes") {
  console.error(
    "TOLAK: script ini menghapus SELURUH data (drop schema public cascade).\n" +
      "Bila memang ingin mengosongkan database, ulangi dengan CONFIRM_WIPE=yes.\n" +
      "Untuk sekadar menambah kolom pada DB berisi data, JANGAN pakai script ini.",
  );
  process.exit(1);
}

const schema = readFileSync(new URL("../database/schema.sql", import.meta.url), "utf8");
const sql = `drop schema if exists public cascade;\ncreate schema public;\n${schema}`;

const client = new Client(url);
await client.connect();
try {
  await client.query(sql);
  console.log("✓ Skema diterapkan ke Neon.");
} finally {
  await client.end();
}
