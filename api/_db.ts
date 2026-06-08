/* Koneksi Neon + perakit AppState. Dipakai bersama oleh semua fungsi /api.
   Driver HTTP @neondatabase/serverless (ideal serverless). Mutasi atomik
   memakai sql.transaction([...]). */
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL || "");

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
    legalDocs: r.legal_docs ?? [],
    payoutAccount: r.payout_account,
    balance: Number(r.balance),
    phone: r.phone ?? "",
    email: r.email ?? "",
    description: r.description ?? "",
    website: r.website ?? undefined,
    instagram: r.instagram ?? undefined,
    twitter: r.twitter ?? undefined,
    facebook: r.facebook ?? undefined,
    pic: {
      name: r.pic_name ?? "",
      phone: r.pic_phone ?? "",
      position: r.pic_position ?? "",
      email: r.pic_email ?? "",
      idDocUrl: r.pic_id_doc_url ?? "",
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
  const [users, orgs, funders, pengajuan, items, history, audit, notifs] = await Promise.all([
    sql`select * from users order by created_at`,
    sql`select * from organizations order by name`,
    sql`select * from funders order by name`,
    sql`select id, org_id, funder_id, event_name, event_location, event_date, description,
               event_budget, type, requested_amount, benefits, proposal_doc_url, extra_note,
               status, revision_note, created_at, updated_at
          from pengajuan order by updated_at desc`,
    sql`select * from pengajuan_items`,
    sql`select * from pengajuan_history order by created_at`,
    sql`select * from audit_logs order by created_at desc`,
    sql`select * from notifications order by created_at desc`,
  ]);

  const itemsByPgj: Record<string, any[]> = {};
  for (const it of items as any[]) {
    (itemsByPgj[it.pengajuan_id] ||= []).push({ name: it.name, qty: it.qty, unit: it.unit });
  }
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
      type: p.type,
      requestedAmount: p.requested_amount == null ? undefined : Number(p.requested_amount),
      inKindItems: itemsByPgj[p.id] ?? [],
      benefits: p.benefits ?? [],
      proposalDocUrl: p.proposal_doc_url ?? undefined,
      // proposalDocData sengaja TIDAK disertakan (lazy via /api/pengajuan-doc)
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

export const SUBMISSION_FEE = 50000;
