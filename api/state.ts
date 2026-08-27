import type { VercelRequest, VercelResponse } from "@vercel/node";
import { assembleState } from "./_db.js";
import { getSession } from "./_auth.js";

/* State awal client. Isinya disaring per pemanggil (lihat assembleState):
   tanpa sesi → state kosong, bukan dump seluruh basis data. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const s = await getSession(req);
    res.status(200).json(await assembleState(s?.userId));
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
