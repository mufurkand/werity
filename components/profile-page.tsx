"use client";

import PostContainer from "@/components/post-container";
import PostControls from "@/components/post-controls";
import ProfileButtons from "@/components/profile-buttons";
import ProfileMain from "@/components/profile-main";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { ExternalLink, LandPlot } from "lucide-react";
import { useEffect, useState } from "react";
import { type UserProfile } from "@/lib/blockchain/contracts";

interface ProfilePageProps {
  userAddress?: string;
}

export default function ProfilePage({ userAddress }: ProfilePageProps) {
  const { userProfile: contextUserProfile } = useBlockchain();
  const [externalUserProfile, setExternalUserProfile] =
    useState<UserProfile | null>(null);

  const userProfile = userAddress ? externalUserProfile : contextUserProfile;
  const [loading, setLoading] = useState(!!userAddress);

  useEffect(() => {
    // Load user profile from the provided address if available
    if (userAddress) {
      setLoading(true);
      const fetchUserProfile = async () => {
        try {
          const profile = await blockchainService.getUserProfile(userAddress);
          setExternalUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserProfile();
    }
  }, [userAddress]);
  // Early return if userProfile is not loaded
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-theme-primary">Loading profile...</p>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-64 flex-col gap-4">
        <p className="text-theme-primary text-xl">Profile not found</p>
        {userAddress && (
          <p className="text-theme-primary text-sm">
            No user registered at address: {userAddress}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      <ProfileMain targetAddress={userAddress} />
      <div className="bg-theme-secondary-muted w-full p-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <p className="text-2xl font-semibold">
            {userProfile?.username}&apos;s
          </p>
          <p className="text-theme-primary text-2xl font-semibold">Display</p>
        </div>{" "}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x max-w-full">
          {/* Use the real post component for the user's posts */}
          <PostContainer userId={userAddress || undefined} />
        </div>
      </div>
      <div className="p-8 flex gap-4 items-center">
        <ProfileButtons />
        <div className="w-0.5 bg-theme-splitter h-8"></div>
        <div className="flex gap-1 items-center">
          <p>Settings</p>
          <ExternalLink />
        </div>
      </div>
      <div className="flex p-8 gap-4">
        <PostContainer />
        <PostControls />
        <div className="w-64 h-96 rounded-lg bg-theme-secondary-muted flex justify-center items-center">
          <LandPlot size={64} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
