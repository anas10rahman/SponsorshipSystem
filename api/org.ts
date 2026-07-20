import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const notifQ = (userId: string, type: string, message: string) =>
  sql`insert into notifications (user_id, type, message) values (${userId}, ${type}, ${message})`;

async function getOrg(id: string): Promise<any> {
  const r = (await sql`select * from organizations where id = ${id} limit 1`) as any[];
  if (!r.length) throw new HttpError(404, "Organisasi tidak ditemukan.");
  return r[0];
}
async function userIdForOrg(orgId: string): Promise<string | null> {
  const r = (await sql`select id from users where org_id = ${orgId} limit 1`) as any[];
  return r[0]?.id ?? null;
}
async function adminUserIds(): Promise<string[]> {
  const r = (await sql`select id from users where role = 'admin'`) as any[];
  return r.map((x) => x.id);
}

/* Data pendaftaran lengkap? (syarat ajukan verifikasi) — pakai baris DB (snake_case). */
function orgRowComplete(o: any): boolean {
  const legalOk = Array.isArray(o.legal_docs) && o.legal_docs.length > 0;
  return (
    legalOk &&
    !!String(o.pic_id_doc_url || "").trim() &&
    !!String(o.payout_account || "").trim() &&
    !!String(o.pic_name || "").trim() &&
    !!String(o.pic_position || "").trim() &&
    !!String(o.pic_phone || "").trim() &&
    !!String(o.pic_email || "").trim()
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const b = readBody(req);

    if (b.op === "update") {
      const o = b.org;
      await sql`
        update organizations set
          name = ${o.name}, category = ${o.category}, city = ${o.city},
          logo_initials = ${o.logoInitials}, logo_url = ${o.logoUrl ?? null},
          email = ${o.email}, description = ${o.description},
          website = ${o.website ?? null}, instagram = ${o.instagram ?? null},
          twitter = ${o.twitter ?? null}, facebook = ${o.facebook ?? null},
          payout_account = ${o.payoutAccount}, phone = ${o.phone},
          legal_docs = ${o.legalDocs ?? []},
          pic_name = ${o.pic.name}, pic_phone = ${o.pic.phone},
          pic_position = ${o.pic.position}, pic_email = ${o.pic.email},
          pic_id_doc_url = ${o.pic.idDocUrl}
        where id = ${o.id}`;
    } else if (b.op === "topup") {
      await sql`update organizations set balance = balance + ${b.amount} where id = ${b.orgId}`;
    } else if (b.op === "request_verification") {
      const o = await getOrg(b.orgId);
      if (o.verification_status === "menunggu")
        throw new HttpError(400, "Verifikasi sedang diproses admin.");
      if (o.verification_status === "terverifikasi")
        throw new HttpError(400, "Organisasi sudah terverifikasi.");
      if (!orgRowComplete(o))
        throw new HttpError(400, "Lengkapi dulu data pendaftaran (dokumen legal, KTP/KTM, rekening, PIC).");
      const tx: any[] = [
        sql`update organizations set verification_status = 'menunggu', verification_note = null, updated_at = now() where id = ${b.orgId}`,
      ];
      for (const aid of await adminUserIds())
        tx.push(notifQ(aid, "verifikasi.diajukan", `Organisasi "${o.name}" mengajukan verifikasi.`));
      await sql.transaction(tx);
    } else if (b.op === "verify_org") {
      const o = await getOrg(b.orgId);
      if (o.verification_status === "terverifikasi")
        throw new HttpError(400, "Organisasi sudah terverifikasi.");
      const tx: any[] = [
        sql`update organizations set verification_status = 'terverifikasi', verified = true, verification_note = null, updated_at = now() where id = ${b.orgId}`,
        sql`insert into audit_logs (actor_id, action, entity, entity_id, meta)
            values (${b.actorId || null}, 'akun.diverifikasi', 'organisasi', ${b.orgId}, '{}'::jsonb)`,
      ];
      const oUser = await userIdForOrg(b.orgId);
      if (oUser)
        tx.push(notifQ(oUser, "verifikasi.disetujui", `Organisasi Anda "${o.name}" telah diverifikasi. Anda kini bisa mengirim pengajuan.`));
      await sql.transaction(tx);
    } else if (b.op === "reject_org") {
      const o = await getOrg(b.orgId);
      const note = String(b.note || "").trim() || "Data tidak memenuhi syarat verifikasi.";
      const tx: any[] = [
        sql`update organizations set verification_status = 'ditolak', verified = false, verification_note = ${note}, updated_at = now() where id = ${b.orgId}`,
      ];
      const oUser = await userIdForOrg(b.orgId);
      if (oUser)
        tx.push(notifQ(oUser, "verifikasi.ditolak", `Verifikasi organisasi "${o.name}" ditolak: ${note}`));
      await sql.transaction(tx);
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }

    res.status(200).json(await assembleState());
  } catch (e: any) {
    const status = e instanceof HttpError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
