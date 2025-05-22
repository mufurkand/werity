"use client";

import { useState, useEffect } from "react";
import { Gift, Clock, Coins, Flame } from "lucide-react";
import { toast } from "sonner";
import blockchainService from "@/lib/blockchain/contracts";
import { motion } from "framer-motion";

interface DailyRewardsSidebarProps {
  onRewardClaimed?: () => void;
}

export function DailyRewardsSidebar({ onRewardClaimed }: DailyRewardsSidebarProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [claimStreak, setClaimStreak] = useState(0);
  const [rewardAmount, setRewardAmount] = useState("100");
  const [isClaiming, setIsClaiming] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);

  // Format time remaining into a compact string
  const formatTimeCompact = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  // Load reward data
  const loadRewardData = async () => {
    try {
      const [
        canClaimResult,
        timeResult,
        streakResult,
        amountResult
      ] = await Promise.all([
        blockchainService.canClaimDailyReward(),
        blockchainService.getTimeUntilNextClaim(),
        blockchainService.getClaimStreak(),
        blockchainService.getDailyRewardAmount()
      ]);

      setCanClaim(canClaimResult);
      setTimeUntilNext(timeResult);
      setClaimStreak(streakResult);
      setRewardAmount(amountResult);
      setIsServiceReady(true);
    } catch (error) {
      console.error("Error loading reward data:", error);
      setIsServiceReady(false);
      // If there's an error, it might be because the service isn't ready yet
      // We'll retry in the next interval
    }
  };

  // Handle claim reward
  const handleClaimReward = async () => {
    if (!canClaim || isClaiming || !isServiceReady) return;

    setIsClaiming(true);
    try {
      toast.loading("Claiming daily reward...");
      const success = await blockchainService.claimDailyReward();
      
      if (success) {
        toast.dismiss();
        toast.success(`Claimed ${rewardAmount} tokens!`);
        
        // Reload data
        await loadRewardData();
        
        // Notify parent component
        if (onRewardClaimed) {
          onRewardClaimed();
        }
      } else {
        toast.dismiss();
        toast.error("Failed to claim reward");
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast.dismiss();
      toast.error("Error claiming reward");
    } finally {
      setIsClaiming(false);
    }
  };

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeUntilNext > 0) {
        setTimeUntilNext(prev => Math.max(0, prev - 1));
      } else if (timeUntilNext === 0 && !canClaim && isServiceReady) {
        loadRewardData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilNext, canClaim, isServiceReady]);

  // Retry loading data if service is not ready
  useEffect(() => {
    if (!isServiceReady) {
      const retryInterval = setInterval(() => {
        loadRewardData();
      }, 5000); // Retry every 5 seconds

      return () => clearInterval(retryInterval);
    }
  }, [isServiceReady]);

  // Initial load
  useEffect(() => {
    loadRewardData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-lg p-4 text-white shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ rotate: canClaim ? [0, 10, -10, 0] : 0 }}
          transition={{ duration: 0.5, repeat: canClaim ? Infinity : 0, repeatDelay: 2 }}
          className="p-1.5 bg-white/20 rounded-md"
        >
          <Gift className="w-4 h-4 text-yellow-300" />
        </motion.div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold">Daily Rewards</h4>
          {claimStreak > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-300">
              <Flame className="w-3 h-3" />
              <span>{claimStreak} streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Reward amount */}
      <div className="flex items-center gap-1 mb-3">
        <Coins className="w-4 h-4 text-yellow-300" />
        <span className="text-lg font-bold text-yellow-300">{rewardAmount}</span>
        <span className="text-xs text-purple-200">SOCIAL</span>
      </div>

      {/* Claim button or timer */}
      {!isServiceReady ? (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border border-purple-200 border-t-transparent rounded-full"
            />
            <span className="text-xs text-purple-200">Loading...</span>
          </div>
        </div>
      ) : canClaim ? (
        <motion.button
          onClick={handleClaimReward}
          disabled={isClaiming}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-semibold py-2.5 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaiming ? "Claiming..." : "Claim Now"}
        </motion.button>
      ) : (
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-purple-200" />
            <span className="text-xs text-purple-200">Next claim in:</span>
          </div>
          <div className="text-sm font-semibold">{formatTimeCompact(timeUntilNext)}</div>
        </div>
      )}
    </motion.div>
  );
} 