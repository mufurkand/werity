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
            <div className="bg-gradient-to-br from-purple-600/20 to-indigo-700/20 rounded-xl p-6 shadow-xl animate-pulse">
              <div className="h-6 bg-purple-400/30 rounded w-32 mb-2"></div>
              <div className="h-4 bg-purple-300/30 rounded w-48 mb-4"></div>
              <div className="h-8 bg-purple-500/30 rounded w-24"></div>
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
            <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl text-center">
              <h3 className="text-lg font-bold mb-2">Daily Rewards</h3>
              <p className="text-purple-200 text-sm mb-4">
                Connect your wallet and register to claim daily tokens!
              </p>
              <a 
                href="/auth" 
                className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 font-semibold py-2 px-4 rounded-lg text-sm hover:scale-105 transition-transform"
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
