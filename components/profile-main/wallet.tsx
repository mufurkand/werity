"use client";

import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { truncateAddress } from "@/lib/utils/addressFormat";
import { ArrowBigDown, ArrowBigUp, Redo } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface WalletProps {
  targetAddress?: string;
}

export default function Wallet({ targetAddress }: WalletProps) {
  const [position, setPosition] = useState({ x: -172, y: -172 });
  const { userAddress: contextUserAddress } = useBlockchain();
  const userAddress = targetAddress || contextUserAddress;
  const [balance, setBalance] = useState("0");

  const loadBalance = useCallback(async () => {
    if (!userAddress) return;
    try {
      const balance = await blockchainService.getBalance(userAddress);
      setBalance(balance);
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  }, [userAddress]);

  useEffect(() => {
    if (userAddress) {
      loadBalance();
    }
  }, [userAddress, loadBalance]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: event.clientX - rect.left - 192, // Adjusted for centering (half of 96px radius)
      y: event.clientY - rect.top - 192, // Adjusted for centering (half of 96px radius)
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: -172, y: -172 });
  };

  const gradientStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    transition: "left 0.3s linear, top 0.3s linear", // Linear animation
  };

  return (
    <div
      className="bg-theme-secondary-muted p-6 rounded-lg flex flex-col justify-between w-[500px] h-56 transition hover:scale-105 duration-300 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex justify-between items-center">
        <p className="text-4xl text-theme-accent font-bold">{balance}$</p>
        <p className="text-theme-primary">WERITY</p>
      </div>
      <div className="flex justify-between items-end">
        <p className="text-theme-primary">{truncateAddress(userAddress)}</p>
        <div className="flex flex-col gap-0.5 items-end text-theme-primary">
          <div className="flex items-center gap-1">
            <p>Send</p>
            <Redo size={20} />
          </div>
          <div className="flex items-center gap-1">
            <p>Deposit</p>
            <ArrowBigUp size={20} />
          </div>
          <div className="flex items-center gap-1">
            <p>Withdraw</p>
            <ArrowBigDown size={20} />
          </div>
        </div>
      </div>
      {/* circular gradient */}
      <div
        className="absolute rounded-full bg-theme-wallet-gradient blur-3xl w-96 h-96 bg-clip-content pointer-events-none"
        style={gradientStyle}
      ></div>
    </div>
  );
}
