/* Self-check token sesi (api/_auth.ts). Jalankan: node scripts/auth-check.mjs
   Menguji jalur keamanan inti: token sah lolos, token dirusak/kadaluarsa/
   ditandatangani rahasia lain DITOLAK. Tanpa DB — murni kriptografi. */
import { createHmac, timingSafeEqual } from "node:crypto";

// Salinan logika api/_auth.ts (file .ts tak bisa diimpor langsung oleh node).
// Bila _auth.ts berubah, samakan di sini — check ini penjaga terakhirnya.
const MAX_AGE = 60 * 60 * 24 * 7;
const hmac = (secret, data) => createHmac("sha256", secret).update(data).digest("base64url");

function signToken(secret, userId, ageSec = MAX_AGE) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + ageSec}`;
  return `${Buffer.from(payload).toString("base64url")}.${hmac(secret, payload)}`;
}

function verifyToken(secret, token) {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  const enc = new TextEncoder();
  const good = enc.encode(hmac(secret, payload));
  const got = enc.encode(token.slice(dot + 1));
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
  const [userId, expS] = payload.split(".");
  if (!userId || !expS || Number(expS) * 1000 < Date.now()) return null;
  return userId;
}

const S = "rahasia-uji-coba";
const UID = "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d";
let fail = 0;
const check = (name, cond) => {
  if (!cond) {
    fail++;
    console.error(`FAIL: ${name}`);
  } else console.log(`ok  : ${name}`);
};

// 1. Token sah → userId kembali utuh.
check("token sah diterima", verifyToken(S, signToken(S, UID)) === UID);

// 2. Tanda tangan dirusak → ditolak (ini inti anti-pemalsuan sesi).
const t = signToken(S, UID);
const tampered = t.slice(0, t.lastIndexOf(".") + 1) + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
check("tanda tangan palsu ditolak", verifyToken(S, tampered) === null);

// 3. Payload diganti userId lain tanpa tanda tangan ulang → ditolak.
const evil = Buffer.from(`00000000-0000-4000-8000-000000000000.${Math.floor(Date.now() / 1000) + 999}`).toString("base64url");
check("payload ditukar ditolak", verifyToken(S, `${evil}.${t.slice(t.lastIndexOf(".") + 1)}`) === null);

// 4. Rahasia berbeda → ditolak (token server lain tak berlaku).
check("rahasia salah ditolak", verifyToken("rahasia-lain", signToken(S, UID)) === null);

// 5. Kadaluarsa → ditolak.
check("token kadaluarsa ditolak", verifyToken(S, signToken(S, UID, -60)) === null);

// 6. Sampah → ditolak, bukan lempar error.
check("token sampah ditolak", verifyToken(S, "bukan-token") === null);

console.log(fail ? `\n${fail} check GAGAL` : "\nSemua check lolos");
process.exit(fail ? 1 : 0);
