"use client";

import { useState, useEffect } from "react";
import { Gift, Clock, Coins, Zap, Flame } from "lucide-react";
import { toast } from "sonner";
import blockchainService from "@/lib/blockchain/contracts";
import { motion, AnimatePresence } from "framer-motion";

interface DailyRewardsProps {
  onRewardClaimed?: () => void;
}

export function DailyRewards({ onRewardClaimed }: DailyRewardsProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState("0");
  const [claimStreak, setClaimStreak] = useState(0);
  const [rewardAmount, setRewardAmount] = useState("100");
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isServiceReady, setIsServiceReady] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Format time remaining into hours, minutes, seconds
  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0")
    };
  };

  const timeFormatted = formatTimeRemaining(timeUntilNext);

  // Load reward data
  const loadRewardData = async () => {
    try {
      setIsLoading(true);

      const [
        canClaimResult,
        timeResult,
        totalResult,
        streakResult,
        amountResult
      ] = await Promise.all([
        blockchainService.canClaimDailyReward(),
        blockchainService.getTimeUntilNextClaim(),
        blockchainService.getTotalClaimedRewards(),
        blockchainService.getClaimStreak(),
        blockchainService.getDailyRewardAmount()
      ]);

      setCanClaim(canClaimResult);
      setTimeUntilNext(timeResult);
      setTotalClaimed(totalResult);
      setClaimStreak(streakResult);
      setRewardAmount(amountResult);
      setIsServiceReady(true);
      setHasInitialData(true);
    } catch (error) {
      console.error("Error loading reward data:", error);
      setIsServiceReady(false);
      // Don't show error toast on every retry, just log it
      console.log("Daily rewards service not ready yet, will retry...");
    } finally {
      setIsLoading(false);
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
        toast.success(`Successfully claimed ${rewardAmount} tokens!`);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        
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

  // Update timer every second - only run after we have initial data
  useEffect(() => {
    if (!hasInitialData) return;

    const interval = setInterval(() => {
      if (timeUntilNext > 0) {
        setTimeUntilNext(prev => Math.max(0, prev - 1));
      } else if (timeUntilNext === 0 && !canClaim) {
        // Check if can claim when timer reaches 0
        loadRewardData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeUntilNext, canClaim, hasInitialData]);

  // Initial load
  useEffect(() => {
    loadRewardData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-theme-secondary to-theme-secondary-muted border border-theme-splitter/20 p-4 text-theme-text shadow-xl w-full max-w-sm"
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * 100,
                  rotate: 0,
                  scale: 0
                }}
                animate={{ 
                  y: 200, 
                  x: Math.random() * 100,
                  rotate: 360,
                  scale: 1
                }}
                transition={{ 
                  duration: 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
                className="absolute w-2 h-2 bg-theme-accent rounded-full"
                style={{ left: `${Math.random() * 100}%` }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent opacity-5 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-theme-accent opacity-5 rounded-full translate-y-12 -translate-x-12" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: canClaim ? [0, 10, -10, 0] : 0 }}
            transition={{ duration: 0.5, repeat: canClaim ? Infinity : 0, repeatDelay: 2 }}
            className="p-1.5 bg-theme-accent/20 rounded-lg backdrop-blur-sm"
          >
            <Gift className="w-5 h-5 text-theme-accent" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-theme-text">Daily Rewards</h3>
            <p className="text-theme-primary/70 text-xs">Claim your daily tokens!</p>
          </div>
        </div>
        {claimStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-theme-accent/20 px-2 py-1 rounded-full"
          >
            <Flame className="w-3 h-3 text-theme-accent" />
            <span className="text-xs font-semibold">{claimStreak} day streak</span>
          </motion.div>
        )}
      </div>

      {/* Reward Amount */}
      <motion.div 
        className="text-center mb-4"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Coins className="w-6 h-6 text-theme-accent" />
          <span className="text-2xl font-bold text-theme-accent">{rewardAmount}</span>
          <span className="text-sm text-theme-primary/70">SOCIAL</span>
        </div>
        <p className="text-theme-primary/70 text-xs">Daily reward amount</p>
      </motion.div>

      {/* Claim Button or Timer */}
      <div className="mb-3">
        {canClaim ? (
          <motion.button
            onClick={handleClaimReward}
            disabled={isClaiming}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-theme-accent to-theme-accent/80 text-theme-bg font-bold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isClaiming ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-theme-bg border-t-transparent rounded-full"
                />
                Claiming...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Claim Reward
              </>
            )}
          </motion.button>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-theme-primary/70" />
              <span className="text-theme-primary/70">Next claim in:</span>
            </div>
            {hasInitialData ? (
              <div className="flex justify-center gap-1">
                {Object.entries(timeFormatted).map(([unit, value]) => (
                  <motion.div
                    key={unit}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="bg-theme-secondary-muted/50 backdrop-blur-sm rounded-lg p-2 min-w-[45px]"
                  >
                    <div className="text-lg font-bold text-center text-theme-text">{value}</div>
                    <div className="text-xs text-theme-primary/70 text-center uppercase">{unit.slice(0, 1)}</div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center gap-1">
                {['H', 'M', 'S'].map((unit) => (
                  <div
                    key={unit}
                    className="bg-theme-secondary-muted/50 backdrop-blur-sm rounded-lg p-2 min-w-[45px] animate-pulse"
                  >
                    <div className="text-lg font-bold text-center text-theme-text">--</div>
                    <div className="text-xs text-theme-primary/70 text-center uppercase">{unit}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-theme-splitter/20">
        <div className="text-center">
          <div className="text-lg font-bold text-theme-accent">{parseFloat(totalClaimed).toFixed(0)}</div>
          <div className="text-xs text-theme-primary/70">Total Claimed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-theme-accent">{claimStreak}</div>
          <div className="text-xs text-theme-primary/70">Streak Days</div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-theme-secondary/20 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
} 