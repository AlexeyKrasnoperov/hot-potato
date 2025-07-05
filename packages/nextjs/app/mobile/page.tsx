"use client";

import { useEffect, useState } from "react";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { ethers } from "ethers";
import { toast } from "sonner";

export default function MobilePage() {
  const [selfAddress, setSelfAddress] = useState<string | null>(null);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("selfAddress");
    if (stored) setSelfAddress(stored);
  }, []);

  const scanSelf = async () => {
    setIsLoading(true);
    try {
      const addr = await getArxAddress();
      setSelfAddress(addr);
      localStorage.setItem("selfAddress", addr);
      toast.success("Your bracelet is linked");
    } catch (e) {
      alert(e);
      toast.error("Failed to scan your bracelet");
      console.error(e);
    }
    setIsLoading(false);
  };

  const scanOther = async () => {
    setIsLoading(true);
    try {
      const addr = await getArxAddress();
      setScannedAddress(addr);
      toast.success("Scanned other player");
    } catch (e) {
      toast.error("Failed to scan target");
      console.error(e);
    }
    setIsLoading(false);
  };

  async function getArxAddress(): Promise<string> {
    const res = await execHaloCmdWeb({ name: "get_pkeys", args: {} });
    const address = res.etherAddresses["1"];
    return address;
  }

  async function signMessage(message: string): Promise<string> {
    const hash = ethers.hashMessage(message);
    const res = await execHaloCmdWeb({ name: "sign_challenge", challenge: hash });
    return res.signature;
  }

  const signAndSend = async () => {
    if (!selfAddress || !scannedAddress) return;
    setIsLoading(true);
    try {
      const message = `pass_potato_to:${scannedAddress}`;
      const sig = await signMessage(message);
      const res = await fetch("/api/pass-potato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: selfAddress, to: scannedAddress, signature: sig }),
      });
      if (res.ok) {
        toast.success("Potato passed!");
      } else {
        toast.error("Backend error");
      }
    } catch (e) {
      console.error(e);
      toast.error("Signing failed");
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center space-y-4">
      {!selfAddress ? (
        <div className="w-full max-w-sm bg-white border rounded-lg shadow p-4">
          <div className="text-center font-semibold mb-4">Scan your own bracelet</div>
          <button
            className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            onClick={scanSelf}
            disabled={isLoading}
          >
            Scan
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-white border rounded-lg shadow p-4 space-y-4">
          <div className="text-sm text-gray-500 text-center">Your address</div>
          <input className="w-full border rounded px-3 py-2 text-sm" value={selfAddress} readOnly />
          <button
            onClick={() => {
              localStorage.removeItem("selfAddress");
              setSelfAddress(null);
            }}
            className="text-xs text-gray-500 underline hover:text-red-500 self-end"
          >
            Forget wristband
          </button>
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={scanOther}
            disabled={isLoading}
          >
            Scan other player
          </button>
          {scannedAddress && (
            <>
              <input className="w-full border rounded px-3 py-2 text-sm" value={scannedAddress} readOnly />
              <button
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={signAndSend}
                disabled={isLoading}
              >
                Pass the potato
              </button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
