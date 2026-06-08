import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assembleState } from "./_db";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).json(await assembleState());
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
