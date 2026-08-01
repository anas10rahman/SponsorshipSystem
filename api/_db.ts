/* Koneksi Neon + perakit AppState. Dipakai bersama oleh semua fungsi /api.
   Driver HTTP @neondatabase/serverless (ideal serverless). Mutasi atomik
   memakai sql.transaction([...]). */
import { neon } from "@neondatabase/serverless";

// Lazy: konstruksi ditunda sampai query pertama, supaya env yang belum
// siap muncul sebagai error JSON (bukan crash saat module load).
let _sql: ReturnType<typeof neon> | null = null;
function realSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum diset di server.");
    _sql = neon(url);
  }
  return _sql;
}
export const sql: any = (strings: TemplateStringsArray, ...vals: any[]) =>
  realSql()(strings, ...vals);
sql.transaction = (...args: any[]) => (realSql() as any).transaction(...args);

/* ---------- Row → object mappers (snake_case → camelCase) ---------- */

export function mapUser(r: any) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    username: r.username,
    password: "", // tidak pernah dikirim ke client
    role: r.role,
    orgId: r.org_id ?? undefined,
    funderId: r.funder_id ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapOrg(r: any) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    city: r.city,
    logoInitials: r.logo_initials,
    logoUrl: r.logo_url ?? undefined,
    verified: r.verified,
    verificationStatus: r.verification_status ?? "belum_diajukan",
    verificationNote: r.verification_note ?? undefined,
    comproUrl: r.compro_url ?? undefined,
    // Berkas legal: sumber baru jsonb [{name,data}]; data tak ikut dikirim.
    // Baris lama yang hanya punya text[] tetap terbaca.
    legalDocs: (Array.isArray(r.legal_docs_data) && r.legal_docs_data.length
      ? r.legal_docs_data.map((d: any) => ({ name: String(d?.name ?? "") }))
      : (r.legal_docs ?? []).map((n: string) => ({ name: String(n) }))
    ).filter((d: any) => d.name),
    payoutAccount: r.payout_account,
    balance: Number(r.balance),
    phone: r.phone ?? "",
    email: r.email ?? "",
    description: r.description ?? "",
    website: r.website ?? undefined,
    instagram: r.instagram ?? undefined,
    tiktok: r.tiktok ?? undefined,
    twitter: r.twitter ?? undefined,
    facebook: r.facebook ?? undefined,
    pic: {
      name: r.pic_name ?? "",
      phone: r.pic_phone ?? "",
      position: r.pic_position ?? "",
      email: r.pic_email ?? "",
      idDocUrl: r.pic_id_doc_url ?? "",
      // Foto PIC bisa mencapai 2MB — tidak ikut di /api/state, hanya penanda
      // ada/tidaknya. Isinya diambil lazy lewat /api/org-doc?kind=picphoto.
      hasPhoto: !!r.pic_has_photo,
    },
  };
}

export function mapFunder(r: any) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    focus: r.focus ?? [],
    budgetTotal: Number(r.budget_total),
    budgetRemaining: Number(r.budget_remaining),
    phone: r.phone ?? "",
    email: r.email ?? "",
    description: r.description ?? "",
    website: r.website ?? undefined,
    instagram: r.instagram ?? undefined,
    twitter: r.twitter ?? undefined,
    facebook: r.facebook ?? undefined,
    logoUrl: r.logo_url ?? undefined,
    address: r.address ?? "",
    comproUrl: r.compro_url ?? undefined,
    legalDocs: (Array.isArray(r.legal_docs_data) ? r.legal_docs_data : [])
      .map((d: any) => ({ name: String(d?.name ?? "") }))
      .filter((d: any) => d.name),
    pic: {
      name: r.pic_name ?? "",
      phone: r.pic_phone ?? "",
      position: r.pic_position ?? "",
      email: r.pic_email ?? "",
    },
  };
}

/* ---------- Rakit AppState (tanpa password, tanpa PDF base64) ---------- */
export async function assembleState() {
  const [users, orgs, funders, pengajuan, history, audit, notifs] = await Promise.all([
    sql`select * from users order by created_at`,
    // Kolom eksplisit: SENGAJA tanpa compro_data & pic_id_doc_data (base64 s/d 2MB).
    // Blob itu tak dipakai mapOrg dan diambil lazy via /api/org-doc — kalau ikut
    // ditarik di sini, tiap mutasi menyeret puluhan MB dari DB lalu dibuang.
    sql`select id, name, category, city, logo_initials, logo_url, verified,
               verification_status, verification_note, legal_docs, payout_account,
               coalesce(
                 (select jsonb_agg(jsonb_build_object('name', e->>'name'))
                    from jsonb_array_elements(legal_docs_data) e),
                 '[]'::jsonb
               ) as legal_docs_data,
               balance, phone, email, description, website, instagram, twitter,
               facebook, tiktok, compro_url, pic_name, pic_phone, pic_position,
               pic_email, pic_id_doc_url, (pic_photo is not null) as pic_has_photo,
               created_at, updated_at
          from organizations order by name`,
    // Kolom eksplisit: tanpa compro_data & isi berkas legal (base64 s/d 2MB).
    // Sama seperti organizations — blob diambil lazy lewat /api/org-doc.
    sql`select id, name, type, focus, budget_total, budget_remaining, phone, email,
               description, website, instagram, twitter, facebook, logo_url, address,
               compro_url, pic_name, pic_phone, pic_position, pic_email,
               created_at, updated_at,
               coalesce(
                 (select jsonb_agg(jsonb_build_object('name', e->>'name'))
                    from jsonb_array_elements(legal_docs_data) e),
                 '[]'::jsonb
               ) as legal_docs_data
          from funders order by name`,
    sql`select id, org_id, funder_id, event_name, event_location, event_date, description,
               event_budget, packages, selected_package, proposal_doc_url, extra_note,
               status, revision_note, created_at, updated_at,
               coalesce(
                 (select jsonb_agg(jsonb_build_object('name', elem->>'name'))
                    from jsonb_array_elements(documents) elem),
                 '[]'::jsonb
               ) as documents
          from pengajuan order by updated_at desc`,
    sql`select * from pengajuan_history order by created_at`,
    sql`select * from audit_logs order by created_at desc`,
    sql`select * from notifications order by created_at desc`,
  ]);

  const histByPgj: Record<string, any[]> = {};
  for (const h of history as any[]) {
    (histByPgj[h.pengajuan_id] ||= []).push({
      action: h.action,
      actor: h.actor,
      note: h.note ?? "",
      at: h.created_at,
    });
  }

  return {
    users: (users as any[]).map(mapUser),
    organizations: (orgs as any[]).map(mapOrg),
    funders: (funders as any[]).map(mapFunder),
    proposals: [],
    transactions: [],
    pengajuan: (pengajuan as any[]).map((p) => ({
      id: p.id,
      orgId: p.org_id,
      funderId: p.funder_id,
      eventName: p.event_name,
      eventLocation: p.event_location,
      eventDate: p.event_date ?? "",
      description: p.description,
      eventBudget: Number(p.event_budget),
      packages: (p.packages ?? []).map((pk: any) => ({
        name: pk.name ?? "",
        requests: (Array.isArray(pk.requests) ? pk.requests : []).map((r: any) =>
          typeof r === "string"
            ? { type: "in_kind", amount: 0, spec: r }
            : {
                type: r?.type === "in_cash" ? "in_cash" : "in_kind",
                amount: Number(r?.amount) || 0,
                spec: String(r?.spec ?? ""),
              },
        ),
        benefits: pk.benefits ?? [],
      })),
      selectedPackage: p.selected_package == null ? undefined : Number(p.selected_package),
      // Dokumen: hanya nama (data diambil lazy via /api/pengajuan-doc).
      // Fallback data lama: proposal_doc_url tunggal → satu dokumen.
      documents:
        Array.isArray(p.documents) && p.documents.length
          ? p.documents.map((d: any) => ({ name: String(d?.name ?? "") }))
          : p.proposal_doc_url
            ? [{ name: String(p.proposal_doc_url) }]
            : [],
      extraNote: p.extra_note ?? undefined,
      status: p.status,
      revisionNote: p.revision_note ?? undefined,
      history: histByPgj[p.id] ?? [],
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
    auditLogs: (audit as any[]).map((l) => ({
      id: l.id,
      actorId: l.actor_id ?? "",
      action: l.action,
      entity: l.entity,
      entityId: l.entity_id,
      meta: l.meta ?? {},
      createdAt: l.created_at,
    })),
    notifications: (notifs as any[]).map((n) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      message: n.message,
      read: n.read,
      link: n.link ?? undefined,
      createdAt: n.created_at,
    })),
    session: { userId: null },
  };
}

/* ---------- Util ---------- */
export function readBody(req: any): any {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function makePengajuanId() {
  const d = new Date();
  const tail = String(Math.floor(1000 + Math.random() * 9000));
  return `PGJ-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}-${tail}`;
}

/* Alur biaya pengajuan:
   - Saat organisasi mengirim pengajuan: saldo dipotong SUBMISSION_FEE (50rb).
   - Bila disetujui mitra sponsor: seluruh 50rb menjadi biaya admin — tidak
     dikembalikan (APPROVE_REFUND = 0).
   - Bila ditolak: biaya admin REJECT_ADMIN_FEE (10rb) ditahan, sisanya
     (40rb) dikembalikan ke saldo organisasi. */
export const SUBMISSION_FEE = 50000;
export const APPROVE_REFUND = 0; // disetujui: tidak ada pengembalian
export const REJECT_ADMIN_FEE = 10000; // ditolak: biaya admin
export const REJECT_REFUND = SUBMISSION_FEE - REJECT_ADMIN_FEE; // 40rb
