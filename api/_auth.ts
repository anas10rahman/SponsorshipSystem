/* Sesi terautentikasi untuk semua /api/*.
   Token stateless bertanda-tangan HMAC-SHA256 (tak perlu tabel sesi),
   disimpan di cookie HttpOnly. Server = otoritas identitas + peran.
   Rahasia dari env SESSION_SECRET (wajib diset di Vercel & .env lokal). */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { sql } from "./_db.js";

const COOKIE = "sh_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type Session = {
  userId: string;
  role: "admin" | "org" | "funder";
  orgId: string | null;
  funderId: string | null;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new AuthError(500, "SESSION_SECRET is not set on the server.");
  return s;
}
function hmac(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signToken(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${Buffer.from(payload).toString("base64url")}.${hmac(payload)}`;
}

/** Diekspor untuk self-check di scripts/auth-check.mjs. */
export function verifyToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString();
  const enc = new TextEncoder();
  const good = enc.encode(hmac(payload));
  const got = enc.encode(token.slice(dot + 1));
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
  const [userId, expS] = payload.split(".");
  if (!userId || !expS || Number(expS) * 1000 < Date.now()) return null;
  return userId;
}

function readCookie(req: VercelRequest, name: string): string | null {
  const h = req.headers.cookie;
  if (!h) return null;
  for (const part of h.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name)
      return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function setSession(res: VercelResponse, userId: string): void {
  const v = encodeURIComponent(signToken(userId));
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
  );
}
export function clearSession(res: VercelResponse): void {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export async function getSession(req: VercelRequest): Promise<Session | null> {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const r = (await sql`
    select id, role, org_id, funder_id from users where id = ${userId} limit 1`) as any[];
  if (!r.length) return null;
  return {
    userId: r[0].id,
    role: r[0].role,
    orgId: r[0].org_id ?? null,
    funderId: r[0].funder_id ?? null,
  };
}

/** Wajib login. Lempar 401 bila tak ada sesi valid. */
export async function requireAuth(req: VercelRequest): Promise<Session> {
  const s = await getSession(req);
  if (!s) throw new AuthError(401, "Invalid session. Please sign in.");
  return s;
}
export function requireAdmin(s: Session): void {
  if (s.role !== "admin") throw new AuthError(403, "Butuh akses admin.");
}
/** Caller pemilik organisasi ini, atau admin. */
export function requireOrg(s: Session, orgId: string): void {
  if (s.role === "admin") return;
  if (s.role !== "org" || !s.orgId || s.orgId !== orgId)
    throw new AuthError(403, "Tidak berhak atas organisasi ini.");
}
/** Caller pemilik mitra sponsor ini, atau admin. */
export function requireFunder(s: Session, funderId: string): void {
  if (s.role === "admin") return;
  if (s.role !== "funder" || !s.funderId || s.funderId !== funderId)
    throw new AuthError(403, "Tidak berhak atas mitra sponsor ini.");
}
