import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { id, to } = req.body;
  if (!id || !to) return res.status(400).json({ error: "Missing fields" });

  try {
    const tx = await contract.passPotato(id, to);
    await tx.wait();
    res.status(200).json({ success: true, tx: tx.hash });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
