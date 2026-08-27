import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, assembleState, readBody } from "./_db.js";
import { AuthError, requireAuth, requireAdmin, requireOrg } from "./_auth.js";

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const notifQ = (userId: string, type: string, message: string, link: string | null = null) =>
  sql`insert into notifications (user_id, type, message, link)
      values (${userId}, ${type}, ${message}, ${link})`;

async function getOrg(id: string): Promise<any> {
  const r = (await sql`select * from organizations where id = ${id} limit 1`) as any[];
  if (!r.length) throw new HttpError(404, "Organization not found.");
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
  return (
    !!String(o.compro_url || "").trim() &&
    !!String(o.pic_id_doc_url || "").trim() &&
    !!String(o.payout_account || "").trim() &&
    !!String(o.pic_name || "").trim() &&
    !!String(o.pic_position || "").trim() &&
    !!String(o.pic_phone || "").trim() &&
    !!String(o.pic_email || "").trim()
  );
}


/* Gabungkan berkas legal masuk dengan yang tersimpan: poin tanpa `data`
   (mis. saat menyimpan profil tanpa mengunggah ulang) mempertahankan isi lama
   berdasarkan nama. Hanya berkas yang akhirnya punya data yang disimpan. */
async function resolveLegalDocs(
  table: "organizations" | "funders",
  id: string,
  incoming: any,
): Promise<any[]> {
  const docs = Array.isArray(incoming) ? incoming : [];
  const prev =
    table === "organizations"
      ? ((await sql`select legal_docs_data from organizations where id = ${id} limit 1`) as any[])
      : ((await sql`select legal_docs_data from funders where id = ${id} limit 1`) as any[]);
  const stored: any[] = Array.isArray(prev[0]?.legal_docs_data) ? prev[0].legal_docs_data : [];
  const byName = new Map<string, string>();
  for (const d of stored) if (d?.name && d?.data) byName.set(String(d.name), String(d.data));
  return docs
    .filter((d: any) => (d?.name || "").trim())
    .map((d: any) => ({
      name: String(d.name),
      data: d?.data ? String(d.data) : byName.get(String(d.name)) ?? null,
    }))
    .filter((d: any) => d.data);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await requireAuth(req);
    const b = readBody(req);

    if (b.op === "update") {
      const o = b.org;
      requireOrg(session, String(o?.id || ""));
      const legal = await resolveLegalDocs("organizations", o.id, o.legalDocs);
      await sql`
        update organizations set
          name = ${o.name}, category = ${o.category}, city = ${o.city},
          logo_initials = ${o.logoInitials}, logo_url = ${o.logoUrl ?? null},
          compro_url = ${o.comproUrl ?? null},
          compro_data = coalesce(${o.comproData ?? null}, compro_data),
          email = ${o.email}, description = ${o.description},
          website = ${o.website ?? null}, instagram = ${o.instagram ?? null},
          tiktok = ${o.tiktok ?? null},
          twitter = ${o.twitter ?? null}, facebook = ${o.facebook ?? null},
          payout_account = ${o.payoutAccount}, phone = ${o.phone},
          legal_docs = ${legal.map((d: any) => d.name)},
          legal_docs_data = ${JSON.stringify(legal)}::jsonb,
          pic_name = ${o.pic.name}, pic_phone = ${o.pic.phone},
          pic_position = ${o.pic.position}, pic_email = ${o.pic.email},
          pic_id_doc_url = ${o.pic.idDocUrl},
          pic_id_doc_data = coalesce(${o.pic.idDocData ?? null}, pic_id_doc_data),
          -- Foto PIC: null/absen = biarkan seperti semula, "" = hapus,
          -- selain itu = ganti. Ini mencegah foto hilang saat profil disimpan
          -- tanpa fotonya ikut termuat (isinya diambil lazy).
          pic_photo = case
            when ${o.pic.photo ?? null}::text is null then pic_photo
            when ${o.pic.photo ?? null}::text = '' then null
            else ${o.pic.photo ?? null}::text
          end
        where id = ${o.id}`;
    } else if (b.op === "topup") {
      requireOrg(session, String(b.orgId || ""));
      const amount = Number(b.amount);
      if (!Number.isFinite(amount) || amount <= 0)
        throw new HttpError(400, "Invalid top-up amount.");
      // ponytail: saldo ditambah tanpa bukti bayar (alur pembayaran belum ada).
      // Sudah tak bisa menyasar organisasi lain, tapi WAJIB digantung ke
      // verifikasi payment gateway sebelum dipakai produksi nyata.
      await sql`update organizations set balance = balance + ${amount} where id = ${b.orgId}`;
    } else if (b.op === "request_verification") {
      requireOrg(session, String(b.orgId || ""));
      const o = await getOrg(b.orgId);
      if (o.verification_status === "menunggu")
        throw new HttpError(400, "Verifikasi sedang diproses admin.");
      if (o.verification_status === "terverifikasi")
        throw new HttpError(400, "The organization is already verified.");
      if (!orgRowComplete(o))
        throw new HttpError(400, "Lengkapi dulu data pendaftaran (company profile, KTP/KTM, rekening, PIC).");
      const tx: any[] = [
        sql`update organizations set verification_status = 'menunggu', verification_note = null, updated_at = now() where id = ${b.orgId}`,
      ];
      for (const aid of await adminUserIds())
        tx.push(notifQ(aid, "verifikasi.diajukan", `Organization "${o.name}" requested verification.`, `/admin/organisasi/${o.id}`));
      await sql.transaction(tx);
    } else if (b.op === "verify_org") {
      requireAdmin(session);
      const o = await getOrg(b.orgId);
      if (o.verification_status === "terverifikasi")
        throw new HttpError(400, "The organization is already verified.");
      const tx: any[] = [
        sql`update organizations set verification_status = 'terverifikasi', verified = true, verification_note = null, updated_at = now() where id = ${b.orgId}`,
        sql`insert into audit_logs (actor_id, action, entity, entity_id, meta)
            values (${session.userId}, 'akun.diverifikasi', 'organisasi', ${b.orgId}, '{}'::jsonb)`,
      ];
      const oUser = await userIdForOrg(b.orgId);
      if (oUser)
        tx.push(notifQ(oUser, "verifikasi.disetujui", `Your organization "${o.name}" has been verified. You can now send submissions.`, "/org/profil"));
      await sql.transaction(tx);
    } else if (b.op === "reject_org") {
      requireAdmin(session);
      const o = await getOrg(b.orgId);
      const note = String(b.note || "").trim() || "The data does not meet the verification requirements.";
      const tx: any[] = [
        sql`update organizations set verification_status = 'ditolak', verified = false, verification_note = ${note}, updated_at = now() where id = ${b.orgId}`,
      ];
      const oUser = await userIdForOrg(b.orgId);
      if (oUser)
        tx.push(notifQ(oUser, "verifikasi.ditolak", `Verification for organization "${o.name}" was rejected: ${note}`, "/org/profil"));
      await sql.transaction(tx);
    } else if (b.op === "delete_org") {
      // Admin hapus organisasi: hapus akun login + transaksi dulu (FK), lalu
      // organisasi (pengajuan & turunannya ikut cascade).
      requireAdmin(session);
      await getOrg(b.orgId); // pastikan ada (404 bila tidak)
      await sql.transaction([
        sql`delete from transactions where org_id = ${b.orgId}`,
        sql`delete from users where org_id = ${b.orgId}`,
        sql`delete from organizations where id = ${b.orgId}`,
      ]);
    } else {
      return res.status(400).json({ error: "op tidak dikenal" });
    }

    res.status(200).json(await assembleState(session.userId));
  } catch (e: any) {
    const status = e instanceof HttpError || e instanceof AuthError ? e.status : 500;
    res.status(status).json({ error: String(e?.message || e) });
  }
}
