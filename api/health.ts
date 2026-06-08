import type { VercelRequest, VercelResponse } from "@vercel/node";

// Diagnostik: tidak mengimpor _db. Uji env + import driver + query trivial.
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const out: any = { hasEnv: !!process.env.DATABASE_URL, node: process.version };
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL || "");
    const r = (await sql`select 1 as ok`) as any[];
    out.dbOk = r[0]?.ok === 1;
  } catch (e: any) {
    out.err = String(e?.message || e);
  }
  res.status(200).json(out);
}
