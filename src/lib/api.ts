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
    if (!r.ok) throw new Error((data as any).error || "Login gagal.");
    return data as { user: { id: string } };
  },

  pengajuan: (body: Record<string, unknown>) => post("pengajuan", body),
  org: (body: Record<string, unknown>) => post("org", body),
  funder: (body: Record<string, unknown>) => post("funder", body),
  notifications: (body: Record<string, unknown>) => post("notifications", body),

  async pengajuanDoc(id: string): Promise<string | null> {
    const r = await fetch(`${BASE}/pengajuan-doc?id=${encodeURIComponent(id)}`);
    if (!r.ok) return null;
    const d = await r.json().catch(() => ({}));
    return (d as any).proposalDocData ?? null;
  },
};

export type { Pengajuan };
