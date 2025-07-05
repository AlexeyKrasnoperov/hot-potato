import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'id' (address)" });
  }

  try {
    const score = await contract.getScore(id);
    res.status(200).json({ address: id, score: score.toString() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
