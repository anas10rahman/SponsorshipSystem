/* Self-check batas percobaan OTP. Jalankan: node scripts/otp-check.mjs
   Meniru logika handleReset/verify-email tanpa DB: kode salah menaikkan
   penghitung, dan di batas ke-5 kodenya dihanguskan (bukan cuma ditolak). */
// Samakan dengan MAX_OTP_ATTEMPTS di api/_email.ts bila diubah.
const MAX_OTP_ATTEMPTS = 5;

/** Model baris `users` seadanya + aturan yang sama dengan handler. */
function makeUser(realCode) {
  return { code: realCode, attempts: 0, expired: false };
}

/** Kembalikan "ok" | "salah" | "dibatalkan" — cermin cabang di handler. */
function tryCode(u, input) {
  if (!u.code) return "dibatalkan"; // kode sudah hangus
  if (u.expired) return "salah";
  const ok = u.code === input;
  if (!ok) {
    const used = u.attempts + 1;
    if (used >= MAX_OTP_ATTEMPTS) {
      u.code = null; // hanguskan
      u.attempts = 0;
      return "dibatalkan";
    }
    u.attempts = used;
    return "salah";
  }
  u.attempts = 0;
  return "ok";
}

let fail = 0;
const check = (name, cond) => {
  if (!cond) {
    fail++;
    console.error(`FAIL: ${name}`);
  } else console.log(`ok  : ${name}`);
};

// 1. Kode benar → lolos.
check("kode benar diterima", tryCode(makeUser("123456"), "123456") === "ok");

// 2. Tebakan beruntun mati di batas — ini inti perbaikannya.
const u = makeUser("123456");
const hasil = [];
for (let i = 0; i < 6; i++) hasil.push(tryCode(u, "000000"));
check(
  `salah ${MAX_OTP_ATTEMPTS - 1}x masih "salah"`,
  hasil.slice(0, MAX_OTP_ATTEMPTS - 1).every((r) => r === "salah"),
);
check(`percobaan ke-${MAX_OTP_ATTEMPTS} menghanguskan kode`, hasil[MAX_OTP_ATTEMPTS - 1] === "dibatalkan");

// 3. Setelah hangus, kode ASLI pun tak berlaku lagi (penyerang & korban sama-sama stop).
check("kode asli tak berlaku setelah hangus", tryCode(u, "123456") === "dibatalkan");

// 4. Kode benar sebelum batas → penghitung nol lagi (percobaan sah tak terhukum).
const u2 = makeUser("123456");
tryCode(u2, "999999");
tryCode(u2, "999999");
check("kode benar mereset penghitung", tryCode(u2, "123456") === "ok" && u2.attempts === 0);

console.log(fail ? `\n${fail} check GAGAL` : "\nSemua check lolos");
process.exit(fail ? 1 : 0);
