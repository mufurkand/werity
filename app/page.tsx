"use client";

import PostContainer from "@/components/post-container";
import PostControls from "@/components/post-controls";
import { DailyRewards } from "@/components/daily-rewards";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";

export default function Home() {
  const { isConnected, userProfile, isInitializing } = useBlockchain();
  
  // Check if user is properly authenticated (connected and has a profile)
  const isAuthenticated = isConnected && userProfile && userProfile.exists;

  // Show loading state while checking for existing session
  if (isInitializing) {
    return (
      <div className="flex p-8 justify-center w-full">
        <div className="flex gap-12 justify-center items-start sm:w-5/6 2xl:w-2/3">
          <PostContainer showAllPosts={true} />
          <div className="flex flex-col gap-4">
            {/* Loading skeleton for daily rewards */}
            <div className="bg-gradient-to-br from-theme-secondary to-theme-secondary-muted border border-theme-splitter/20 rounded-xl p-6 shadow-xl animate-pulse">
              <div className="h-6 bg-theme-accent/30 rounded w-32 mb-2"></div>
              <div className="h-4 bg-theme-accent/20 rounded w-48 mb-4"></div>
              <div className="h-8 bg-theme-accent/40 rounded w-24"></div>
            </div>
            <PostControls />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex p-8 justify-center w-full">
      <div className="flex gap-12 justify-center items-start sm:w-5/6 2xl:w-2/3">
        <PostContainer showAllPosts={true} />
        <div className="flex flex-col gap-4">
          {isAuthenticated ? (
            <DailyRewards />
          ) : (
            <div className="bg-gradient-to-br from-theme-secondary to-theme-secondary-muted border border-theme-splitter/20 rounded-xl p-6 text-theme-text shadow-xl text-center">
              <h3 className="text-lg font-bold mb-2 text-theme-text">Daily Rewards</h3>
              <p className="text-theme-primary/70 text-sm mb-4">
                Connect your wallet and register to claim daily tokens!
              </p>
              <a 
                href="/auth" 
                className="inline-block bg-gradient-to-r from-theme-accent to-theme-accent/80 text-theme-bg font-semibold py-2 px-4 rounded-lg text-sm hover:scale-105 transition-transform"
              >
                Get Started
              </a>
            </div>
          )}
          <PostControls />
        </div>
      </div>
    </div>
  );
}
