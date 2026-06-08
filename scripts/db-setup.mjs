// Bootstrap skema Neon Postgres. Idempotent: reset schema public lalu apply.
// Jalankan: DATABASE_URL=... node scripts/db-setup.mjs
import { readFileSync } from "node:fs";
import { Client } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diset.");
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
