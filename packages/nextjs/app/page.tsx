"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { execHaloCmdWeb } from "@arx-research/libhalo/api/web";
// import { ethers } from "ethers";
import type { NextPage } from "next";
import { toast } from "sonner";

const Home: NextPage = () => {
  const [selfAddress, setSelfAddress] = useState<string | null>(null);
  const [scannedAddress, setScannedAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const [status, setStatus] = useState<null | {
    hasPotato: boolean;
    potatoId: number | null;
    secondsLeft: string | null;
    receivedAt: string | null;
    active: boolean;
    score: string;
    recentHolders: string[];
  }>(null);

  useEffect(() => {
    const stored = localStorage.getItem("selfAddress");
    if (stored) {
      setSelfAddress(stored);
      fetchStatus(stored);
    }
  }, []);

  useEffect(() => {
    if (!status?.receivedAt) return;

    const receivedAt = Number(status.receivedAt); // in seconds
    const limit = 600; // 10 minutes

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, receivedAt + limit - now);
      setSecondsLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);

    return () => clearInterval(interval);
  }, [status?.receivedAt]);

  const fetchStatus = async (addr: string) => {
    try {
      const res = await fetch(`/api/status?address=${addr}`);
      if (!res.ok) throw new Error("Failed to fetch status");
      const data = await res.json();

      setStatus({
        ...data,
        score: data.score ?? "0",
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
      toast.success("Your wristband is linked");
      await fetchStatus(addr);
    } catch (e) {
      alert(e);
      toast.error("Failed to scan your wristband");
      console.error(e);
    }
    setIsLoading(false);
  };

  const scanOther = async () => {
    setIsLoading(true);
    try {
      const addr = await getArxAddress();

      if (addr.toLowerCase() === selfAddress?.toLowerCase()) {
        alert("You cannot scan your own wristband!");
        toast.error("Cannot scan your own address");
        setIsLoading(false);
        return;
      }

      const recent = status?.recentHolders?.map(a => a.toLowerCase()) || [];
      if (recent.includes(addr.toLowerCase())) {
        toast.error("This player has already held the potato recently. Scan someone else!");
        setIsLoading(false);
        return;
      }

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
    const address = res.etherAddresses["2"];
    return address;
  }

  // async function signMessage(message: string): Promise<string> {
  //   const hash = ethers.hashMessage(message);
  //   const hex = hash.replace(/^0x/, "");
  //   const res = await execHaloCmdWeb({ name: "sign_challenge", keyNo: 2, challenge: hex });
  //   return res.signature;
  // }

  const signAndSend = async () => {
    if (!selfAddress || !scannedAddress || !status?.potatoId) return;
    setIsLoading(true);
    try {
      // const message = `pass_potato_to:${scannedAddress}`;
      // const sig = await signMessage(message);
      // console.log(sig);

      alert(
        "Request body:\n" +
          JSON.stringify(
            {
              id: Number(status.potatoId),
              from: String(selfAddress),
              to: String(scannedAddress),
              signature: "123",
            },
            null,
            2,
          ),
      );

      const payload = {
        id: status?.potatoId,
        from: selfAddress,
        to: scannedAddress,
        signature: "",
      };

      const keys = Object.entries(payload).map(([key, value]) => {
        return `${key}: ${typeof value} = ${String(value)}`;
      });

      alert("Payload types:\n" + keys.join("\n"));

      const res = await fetch("/api/pass-potato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: Number(status.potatoId),
          from: String(selfAddress),
          to: String(scannedAddress),
          signature: String("123"),
          // signature: sig,
        }),
      });

      if (res.ok) {
        toast.success("Potato passed!");
        // await fetchStatus(selfAddress);
      } else {
        const { error } = await res.json();
        toast.error(error || "Backend error");
        alert(`Backend error: ${error}`);
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        alert(`Unexpected error: ${e.stack}`);
      } else {
        alert(`Unexpected error: ${String(e)}`);
      }
      toast.error("Signing failed");
    }
    setIsLoading(false);
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center justify-center space-y-4">
      {status && status.hasPotato ? (
        <Image src="/player-with-potato.png" alt="player" width={256} height={256} />
      ) : (
        <Image src="/player.png" alt="player" width={256} height={256} />
      )}
      {status && (
        <div className="text-sm space-y-1 border-t pt-3 mt-3 text-gray-700 dark:text-gray-200">
          {status.hasPotato ? (
            <>
              {/* <div>
                <strong>Score:</strong> {status.score}
              </div> */}
              <div className={"text-center"}>
                <strong>Congrats, you are holding a potato. Pass it to someone else before it expires.</strong>
              </div>
              <div className={`text-center`}>
                <strong>Time left:</strong>
                <div
                  className={`text-4xl font-mono text-center transition-all ${secondsLeft === 0 ? "text-red-600 animate-pulse font-bold" : ""}`}
                >
                  {secondsLeft !== null ? `${secondsLeft} sec` : "—"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>Be brave, mint a potato</div>
              <button
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded"
                onClick={async () => {
                  if (!selfAddress) return;
                  setIsLoading(true);
                  try {
                    const res = await fetch("/api/create-potato", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ address: selfAddress }),
                    });

                    if (res.ok) {
                      toast.success("You received a potato!");
                      await fetchStatus(selfAddress);
                    } else {
                      const { error } = await res.json();
                      toast.error(error || "Failed to create potato");
                      alert(error);
                    }
                  } catch (e) {
                    toast.error("Failed to create potato");
                    console.error(e);
                    alert(e);
                  }
                  setIsLoading(false);
                }}
                disabled={isLoading}
              >
                Mint Potato
              </button>
            </>
          )}
        </div>
      )}
      {!selfAddress ? (
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-4">
          <div className="text-center font-semibold text-gray-800 dark:text-white mb-4">Scan your own wristband</div>
          <button
            className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 dark:hover:bg-gray-600"
            onClick={scanSelf}
            disabled={isLoading}
          >
            Scan
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-4 space-y-4">
          <div className="text-sm text-gray-500 dark:text-gray-300 text-center">Your address</div>
          <input
            className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
            value={selfAddress}
            readOnly
          />
          <button
            onClick={() => {
              localStorage.removeItem("selfAddress");
              setScannedAddress(null);
              setSelfAddress(null);
              setStatus(null);
            }}
            className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-red-500 self-end"
          >
            Forget wristband
          </button>
          {status && status.hasPotato && (
            <>
              <button
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={scanOther}
                disabled={isLoading}
              >
                Scan other player
              </button>
              {scannedAddress && (
                <>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600"
                    value={scannedAddress}
                    readOnly
                  />
                  <button
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                    onClick={signAndSend}
                    disabled={isLoading}
                  >
                    Pass the potato
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
};

export default Home;
