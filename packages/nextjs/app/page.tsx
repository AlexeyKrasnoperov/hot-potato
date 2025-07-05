"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
import { ethers } from "ethers";
import type { NextPage } from "next";
import { toast } from "sonner";

const Home: NextPage = () => {
  const [selfAddress, setSelfAddress] = useState<string | null>(null);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [status, setStatus] = useState<null | {
    hasPotato: boolean;
    potatoId: number | null;
    secondsLeft: string | null;
    receivedAt: string | null;
    active: boolean;
    score: string;
  }>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selfAddress");
    if (stored) {
      setSelfAddress(stored);
      fetchStatus(stored);
    }
  }, []);

  const fetchStatus = async (addr: string) => {
    try {
      const res = await fetch(`/api/status?address=${addr}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();

      const scoreRes = await fetch(`/api/score?id=${addr}`);
      const scoreData = await scoreRes.json();

      setStatus({
        ...data,
        score: scoreData.score ?? "0",
      });
    } catch (e) {
      console.error("Failed to fetch status", e);
      setStatus(null);
    }
  };

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
      alert(e);
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
      await fetchStatus(selfAddress);
    } catch (e) {
      console.error(e);
      alert(e);
      toast.error("Signing failed");
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center space-y-4">
      {!selfAddress ? (
        <Image src="/player.png" alt="player" width={256} height={256} />
      ) : (
        <Image src="/player-with-potato.png" alt="player" width={256} height={256} />
      )}

      {status && (
        <div className="text-sm space-y-1 border-t pt-3 mt-3 text-gray-700">
          <div>
            <strong>Score:</strong> {status.score}
          </div>
          {status.hasPotato ? (
            <>
              <div>
                <strong>Potato ID:</strong> {status.potatoId}
              </div>
              <div>
                <strong>Time left:</strong> {status.secondsLeft} sec
              </div>
              <div>
                <strong>Received at:</strong> {new Date(Number(status.receivedAt) * 1000).toLocaleString()}
              </div>
            </>
          ) : (
            <div>No active potato</div>
          )}
        </div>
      )}

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
};

export default Home;
