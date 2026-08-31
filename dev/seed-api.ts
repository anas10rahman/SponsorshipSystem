/* Dev-only in-memory API untuk `vite dev`.
   `vite` biasa tidak menjalankan fungsi serverless di /api (itu butuh Neon/Vercel),
   sehingga /api/state mengembalikan sumber .ts → app gagal memuat.
   Plugin ini menyajikan data seed lokal (tanpa DB) supaya seluruh halaman bisa
   ditinjau di lokal. HANYA aktif saat `serve` (dev) dan tanpa API_PROXY.
   Tidak memengaruhi build produksi. Aman dihapus kapan pun. */
import type { Plugin, ViteDevServer } from "vite";
import type { AppState, Pengajuan, Notification } from "../src/lib/types";
import { createSeedState } from "../src/lib/seed";

const NOW = new Date().toISOString();

function demoPengajuan(): Pengajuan[] {
  return [
    {
      id: "PGJ-2026-0810-1001",
      orgId: "org-1",
      funderId: "fund-1",
      eventName: "Festival Seni Nusantara 2026",
      eventLocation: "Taman Ismail Marzuki, Jakarta",
      eventDate: "2026-09-20",
      description:
        "Festival seni budaya tahunan yang menampilkan 40+ seniman muda lewat pertunjukan, pameran, dan lokakarya terbuka untuk umum.",
      eventBudget: 150_000_000,
      packages: [
        {
          name: "Gold",
          requests: [
            { type: "in_cash", amount: 50_000_000, spec: "" },
            { type: "in_kind", amount: 0, spec: "Booth 3x3 m di area utama festival" },
          ],
          benefits: ["Logo di panggung utama", "30 detik slot video di layar LED", "10 tiket VIP"],
        },
        {
          name: "Silver",
          requests: [{ type: "in_cash", amount: 25_000_000, spec: "" }],
          benefits: ["Logo di spanduk area", "Sebutan di media sosial"],
        },
      ],
      documents: [{ name: "proposal-festival-seni-nusantara.pdf" }],
      extraNote: "Kami terbuka untuk penyesuaian benefit sesuai kebutuhan brand.",
      status: "diajukan",
      history: [
        { action: "pengajuan.dibuat", actor: "Organisasi", note: "", at: NOW },
        { action: "pengajuan.diajukan", actor: "Organisasi", note: "", at: NOW },
      ],
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "PGJ-2026-0805-1002",
      orgId: "org-1",
      funderId: "fund-2",
      eventName: "Lokakarya Batik Muda",
      eventLocation: "Bandung",
      eventDate: "2026-08-28",
      description:
        "Serangkaian lokakarya membatik untuk 120 pelajar SMA, memperkenalkan warisan batik lewat pendekatan kreatif kekinian.",
      eventBudget: 60_000_000,
      packages: [
        {
          name: "Utama",
          requests: [
            { type: "in_cash", amount: 30_000_000, spec: "" },
            { type: "in_kind", amount: 0, spec: "Kain mori & malam untuk 120 peserta" },
          ],
          benefits: ["Logo di seluruh materi lokakarya", "Sesi brand talk 15 menit"],
        },
      ],
      selectedPackage: 0,
      documents: [{ name: "proposal-lokakarya-batik.pdf" }, { name: "rab-lokakarya.pdf" }],
      status: "disetujui",
      history: [
        { action: "pengajuan.diajukan", actor: "Organisasi", note: "", at: NOW },
        { action: "pengajuan.disetujui", actor: "Pendana", note: "Senang berkolaborasi!", at: NOW },
      ],
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "PGJ-2026-0808-1003",
      orgId: "org-1",
      funderId: "fund-3",
      eventName: "Pameran Fotografi Kota",
      eventLocation: "Yogyakarta",
      eventDate: "2026-10-05",
      description:
        "Pameran karya 25 fotografer jalanan yang mendokumentasikan wajah kota dan kehidupan komunitas urban.",
      eventBudget: 90_000_000,
      packages: [
        {
          name: "Kolaborasi",
          requests: [{ type: "in_cash", amount: 40_000_000, spec: "" }],
          benefits: ["Logo di katalog pameran", "Wall khusus brand"],
        },
      ],
      documents: [{ name: "proposal-pameran-fotografi.pdf" }],
      status: "perlu_revisi",
      revisionNote: "Mohon lampirkan rincian anggaran per item dan jadwal acara yang lebih detail.",
      history: [
        { action: "pengajuan.diajukan", actor: "Organisasi", note: "", at: NOW },
        {
          action: "pengajuan.revisi",
          actor: "Pendana",
          note: "Mohon lampirkan rincian anggaran per item.",
          at: NOW,
        },
      ],
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      id: "PGJ-2026-0801-1004",
      orgId: "org-1",
      funderId: "fund-1",
      eventName: "Konser Amal Anak Negeri",
      eventLocation: "Surabaya",
      eventDate: "2026-07-30",
      description: "Konser amal untuk menggalang dana pendidikan anak-anak prasejahtera.",
      eventBudget: 200_000_000,
      packages: [
        {
          name: "Platinum",
          requests: [{ type: "in_cash", amount: 80_000_000, spec: "" }],
          benefits: ["Logo di panggung", "Penyebutan MC"],
        },
      ],
      documents: [{ name: "proposal-konser-amal.pdf" }],
      status: "ditolak",
      revisionNote: "Anggaran belum sesuai dengan fokus program kami tahun ini.",
      history: [
        { action: "pengajuan.diajukan", actor: "Organisasi", note: "", at: NOW },
        {
          action: "pengajuan.ditolak",
          actor: "Pendana",
          note: "Anggaran belum sesuai fokus program tahun ini.",
          at: NOW,
        },
      ],
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];
}

function demoNotifications(): Notification[] {
  return [
    {
      id: "ntf-1",
      userId: "u-funder",
      type: "pengajuan.diajukan",
      message: "Pengajuan baru dari Yayasan Seni Budaya: Festival Seni Nusantara 2026.",
      read: false,
      link: "/funder/pengajuan",
      createdAt: NOW,
    },
    {
      id: "ntf-2",
      userId: "u-org",
      type: "pengajuan.disetujui",
      message: "Lokakarya Batik Muda disetujui oleh Yayasan Cahaya.",
      read: false,
      link: "/org/pengajuan",
      createdAt: NOW,
    },
    {
      id: "ntf-3",
      userId: "u-org",
      type: "pengajuan.revisi",
      message: "Pameran Fotografi Kota perlu revisi menurut Bank Daya.",
      read: false,
      link: "/org/pengajuan",
      createdAt: NOW,
    },
    {
      id: "ntf-4",
      userId: "u-admin",
      type: "verifikasi.diajukan",
      message: "Yayasan Seni Budaya mengajukan verifikasi organisasi.",
      read: true,
      link: "/admin/organisasi",
      createdAt: NOW,
    },
  ];
}

/** State seed + data transaksional demo, disimpan di memori proses dev. */
function buildState(): AppState {
  const s = createSeedState();
  s.pengajuan = demoPengajuan();
  s.notifications = demoNotifications();
  return s;
}

/** Cookie sesi dev — meniru `sh_session` produksi (tanpa tanda tangan). */
const DEV_COOKIE = "sh_session_dev";

function readCookie(req: any, name: string): string | null {
  const h = req.headers?.cookie;
  if (!h) return null;
  for (const part of String(h).split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name)
      return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

function sanitize(state: AppState): AppState {
  return {
    ...state,
    users: state.users.map((u) => ({ ...u, password: "" })),
    session: { userId: null },
  };
}

/** Saring state seperti assembleState di server: tanpa sesi → kosong. */
function stateFor(state: AppState, userId: string | null): AppState {
  const base = sanitize(state);
  const me = userId ? state.users.find((u) => u.id === userId) : null;
  if (!me)
    return { ...base, users: [], organizations: [], funders: [], pengajuan: [], notifications: [] };
  if (me.role === "admin") return base;
  return {
    ...base,
    users: base.users.filter((u) => u.id === me.id),
    organizations: me.orgId
      ? base.organizations.filter((o) => o.id === me.orgId)
      : base.organizations.filter((o) =>
          state.pengajuan.some((p) => p.orgId === o.id && p.funderId === me.funderId),
        ),
    funders: me.funderId ? base.funders.filter((f) => f.id === me.funderId) : base.funders,
    pengajuan: base.pengajuan.filter((p) =>
      me.orgId ? p.orgId === me.orgId : p.funderId === me.funderId,
    ),
    notifications: base.notifications.filter((n) => n.userId === me.id),
  };
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c: any) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function json(res: any, code: number, obj: unknown) {
  res.statusCode = code;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(obj));
}

export function devSeedApi(): Plugin {
  const state = buildState();

  return {
    name: "dev-seed-api",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      // Lewati bila proxy backend live disetel.
      if (process.env.API_PROXY) return;

      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || "";
        if (!url.startsWith("/api/")) return next();
        const path = url.split("?")[0].replace(/^\/api\//, "");
        const method = (req.method || "GET").toUpperCase();

        const viewerId = () => readCookie(req, DEV_COOKIE);

        try {
          if (path === "state") return json(res, 200, stateFor(state, viewerId()));

          if (path === "health") return json(res, 200, { ok: true, mode: "dev-seed" });

          if (path === "login") {
            const body = await readBody(req);
            if (body.op === "logout") {
              res.setHeader("Set-Cookie", `${DEV_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
              return json(res, 200, { ok: true });
            }
            if (body.op) return json(res, 200, { ok: true, message: "OK (dev)" });
            const u = state.users.find(
              (x) =>
                x.username.trim().toLowerCase() === String(body.username || "").trim().toLowerCase(),
            );
            if (!u || u.password !== body.password)
              return json(res, 401, { error: "Username atau kata sandi salah." });
            res.setHeader(
              "Set-Cookie",
              `${DEV_COOKIE}=${encodeURIComponent(u.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
            );
            return json(res, 200, { user: { id: u.id } });
          }

          if (path === "register")
            return json(res, 200, { needsVerification: true, email: (await readBody(req)).email });

          if (path === "verify-email" || path === "resend-code") {
            await readBody(req);
            return json(res, 200, { ok: true, emailSent: false, state: stateFor(state, viewerId()) });
          }

          if (path === "notifications") {
            const body = await readBody(req);
            const id = body.id || body.notificationId;
            if (body.op === "readAll" || body.all || body.markAll) {
              const uid = body.userId;
              state.notifications.forEach((n) => {
                if (!uid || n.userId === uid) n.read = true;
              });
            } else if (id) {
              const n = state.notifications.find((x) => x.id === id);
              if (n) n.read = true;
            }
            return json(res, 200, stateFor(state, viewerId()));
          }

          // Mutasi lain (org/funder/pengajuan): stub — kembalikan state saat ini.
          if (["org", "funder", "pengajuan"].includes(path)) {
            await readBody(req);
            return json(res, 200, stateFor(state, viewerId()));
          }

          // Dokumen/foto lazy: tidak ada isi di mode seed.
          if (path === "org-doc" || path === "pengajuan-doc")
            return json(res, 200, { data: null });

          return json(res, 404, { error: "Not found (dev-seed)" });
        } catch (e: any) {
          return json(res, 500, { error: String(e?.message || e) });
        }
      });
    },
  };
}
