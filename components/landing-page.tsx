"use client";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { twJoin } from "tailwind-merge";

export default function LandingPage() {
  const [loading, setLoading] = useState(false);
  const { connect } = useBlockchain();

  const handleConnect = async () => {
    try {
      setLoading(true);
      await connect();
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="bg-linear-to-br from-blue-300 to-pink-300 p-px rounded-lg">
        <div className="flex p-10 rounded-lg bg-theme-background items-center gap-4">
          <div className="flex flex-col max-w-md gap-4">
            <h1 className="text-theme-accent font-bold text-2xl">Werity</h1>
            <p>
              Werity is a decentralized social media platform built on
              blockchain technology that puts privacy and data ownership first.
            </p>
          </div>
          <div className="bg-theme-splitter w-0.5 h-12"></div>
          <div className="flex flex-col gap-2">
            <button
              className={twJoin(
                "flex rounded-lg p-2 gap-2 w-56 justify-center",
                loading
                  ? "bg-theme-secondary-muted text-theme-primary"
                  : "bg-theme-secondary"
              )}
              onClick={handleConnect}
              disabled={loading}
            >
              <p>{loading ? "Connecting..." : "Connect with MetaMask"}</p>
              <img
                className="w-6 h-6"
                src="MetaMask-icon-fox.svg"
                alt="MetaMask"
              />
            </button>
            <button
              className="flex justify-center rounded-lg p-2 gap-2 bg-theme-secondary-muted w-56 text-theme-primary"
              disabled={true}
            >
              <p>Create a wallet</p>
              <Wallet />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
