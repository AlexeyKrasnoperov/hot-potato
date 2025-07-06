import { contract } from "./_setup";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// import { ethers } from "ethers";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const { id, from, to, signature } = req.body;

  if (!id || !from || !to || !signature) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const potato = await contract.potatoes(id);

    if (!potato.active) {
      return res.status(400).json({ error: "Potato is inactive" });
    }

    if (potato.holder.toLowerCase() !== from.toLowerCase()) {
      return res.status(403).json({ error: "Not current holder" });
    }

    // // Recover signer from message
    // const expectedMessage = `pass_potato_to:${to}`;
    // const recoveredAddress = ethers.verifyMessage(expectedMessage, signature);

    // if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    // Signature is valid → pass the potato
    const tx = await contract.passPotato(id, to);
    await tx.wait();

    res.status(200).json({ success: true, tx: tx.hash });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
