import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "Missing address" });

  try {
    const tx = await contract.createPotato(address);
    await tx.wait();
    res.status(200).json({ success: true, tx: tx.hash });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
