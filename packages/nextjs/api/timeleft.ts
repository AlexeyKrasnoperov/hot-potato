import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { address } = req.query;

  if (typeof address !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'address'" });
  }

  try {
    const total = await contract.potatoCount();

    for (let i = 1; i <= total; i++) {
      const potato = await contract.potatoes(i);
      if (potato.active && potato.holder.toLowerCase() === address.toLowerCase()) {
        const timeLeft = await contract.getTimeLeft(i);
        return res.status(200).json({
          potatoId: i,
          secondsLeft: timeLeft.toString(),
        });
      }
    }

    res.status(404).json({ error: "No active potato found for this address" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
