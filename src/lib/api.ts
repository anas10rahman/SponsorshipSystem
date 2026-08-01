/* Client API ke serverless functions (/api/*). Server = sumber kebenaran.
   Endpoint mutasi mengembalikan full AppState terbaru. */
import type { AppState, Pengajuan } from "./types";

const BASE = "/api";

async function post(path: string, body: unknown): Promise<AppState> {
  const r = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as any).error || `HTTP ${r.status}`);
  return data as AppState;
}

export const api = {
  async getState(): Promise<AppState> {
    const r = await fetch(`${BASE}/state`);
    if (!r.ok) throw new Error(`Gagal memuat data (HTTP ${r.status})`);
    return r.json();
  },

  async login(username: string, password: string) {
    const r = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 403 && (data as any).needsVerification)
      return data as { needsVerification: true; email: string };
    if (!r.ok) throw new Error((data as any).error || "Login gagal.");
    return data as { user: { id: string } };
  },

  async register(payload: Record<string, unknown>) {
    const r = await fetch(`${BASE}/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any).error || "Registrasi gagal.");
    return data as {
      needsVerification?: true;
      email?: string;
      emailSent?: boolean;
      emailError?: string;
      userId?: string;
      state?: AppState;
    };
  },

  async verifyEmail(email: string, code: string) {
    const r = await fetch(`${BASE}/verify-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any).error || "Verifikasi gagal.");
    return data as { userId: string; state: AppState };
  },

  async resendCode(email: string) {
    const r = await fetch(`${BASE}/resend-code`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any).error || "Gagal kirim ulang kode.");
    return data as { ok: true; emailSent: boolean; emailError?: string };
  },

  async forgotPassword(email: string) {
    // Digabung ke /api/login (op) demi tetap di bawah limit fungsi Vercel Hobby.
    const r = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "forgot", email }),
    });
    const data = await r.json().catch(() => ({}));
    // Endpoint sengaja selalu 200 & netral; error jaringan tetap dilempar.
    if (!r.ok) throw new Error((data as any).error || "Gagal mengirim kode reset.");
    return data as { ok: true; message: string };
  },

  async changePassword(userId: string, currentPassword: string, password: string) {
    const r = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "change", userId, currentPassword, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any).error || "Gagal mengganti kata sandi.");
    return data as { ok: true };
  },

  async resetPassword(email: string, code: string, password: string) {
    const r = await fetch(`${BASE}/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ op: "reset", email, code, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((data as any).error || "Gagal reset kata sandi.");
    return data as { ok: true };
  },

  pengajuan: (body: Record<string, unknown>) => post("pengajuan", body),
  org: (body: Record<string, unknown>) => post("org", body),
  funder: (body: Record<string, unknown>) => post("funder", body),
  notifications: (body: Record<string, unknown>) => post("notifications", body),

  /** Ambil isi (data URL) lampiran organisasi. `legal` memakai indeks berkas. */
  async orgDoc(
    orgId: string,
    kind: "compro" | "ktp" | "legal" | "picphoto",
    index = 0,
  ): Promise<string | null> {
    const r = await fetch(
      `${BASE}/org-doc?orgId=${encodeURIComponent(orgId)}&kind=${kind}&index=${index}`,
    );
    if (!r.ok) return null;
    const d = await r.json().catch(() => ({}));
    return (d as any).data ?? null;
  },

  /** Ambil isi (data URL) lampiran mitra sponsor. */
  async funderDoc(
    funderId: string,
    kind: "compro" | "legal",
    index = 0,
  ): Promise<string | null> {
    const r = await fetch(
      `${BASE}/org-doc?funderId=${encodeURIComponent(funderId)}&kind=${kind}&index=${index}`,
    );
    if (!r.ok) return null;
    const d = await r.json().catch(() => ({}));
    return (d as any).data ?? null;
  },

  /** Ambil isi (data URL) satu dokumen pendukung berdasarkan indeks. */
  async pengajuanDoc(id: string, index = 0): Promise<string | null> {
    const r = await fetch(
      `${BASE}/pengajuan-doc?id=${encodeURIComponent(id)}&index=${index}`,
    );
    if (!r.ok) return null;
    const d = await r.json().catch(() => ({}));
    return (d as any).data ?? (d as any).proposalDocData ?? null;
  },
};

export type { Pengajuan };
