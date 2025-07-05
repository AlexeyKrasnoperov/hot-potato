import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  try {
    const total = await contract.potatoCount();
    const now = Math.floor(Date.now() / 1000);
    const TIME_LIMIT = 600; // 10 minutes

    const burned: number[] = [];
    for (let i = 1; i <= total; i++) {
      const p = await contract.potatoes(i);

      const isExpired = p.active && now > Number(p.receivedAt) + TIME_LIMIT;
      const isHeldByEOA = p.holder !== "0x0000000000000000000000000000000000000000";

      if (isExpired && isHeldByEOA) {
        try {
          const tx = await contract.burnPotato(i);
          await tx.wait();
          burned.push(i);
        } catch (e) {
          console.warn(`Failed to burn potato ${i}`, e);
        }
      }
    }

    res.status(200).json({ burnedCount: burned.length, burnedPotatoes: burned });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
