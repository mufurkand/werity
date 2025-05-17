"use client";

import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { truncateAddress } from "@/lib/utils/addressFormat";
import Link from "next/link";
import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/blockchain/contracts";

export default function UserDirectory() {
  const { userAddress } = useBlockchain();
  const [sampleAddresses, setSampleAddresses] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  // Get a list of sample addresses from recent interactions
  useEffect(() => {
    const getUsers = async () => {
      if (!userAddress) return;

      try {
        // Try to get followers and following for the current user
        const followers = await blockchainService.getFollowers(userAddress);
        const following = await blockchainService.getFollowing(userAddress);

        // Combine and deduplicate
        const uniqueAddresses = [...new Set([...followers, ...following])];

        // Always include the current user
        if (!uniqueAddresses.includes(userAddress)) {
          uniqueAddresses.unshift(userAddress);
        }

        // Limit to 5 addresses
        const limitedAddresses = uniqueAddresses.slice(0, 5);
        setSampleAddresses(limitedAddresses);

        // Fetch profiles for all addresses
        const profiles: Record<string, UserProfile> = {};
        for (const address of limitedAddresses) {
          const profile = await blockchainService.getUserProfile(address);
          if (profile) {
            profiles[address] = profile;
          }
        }

        setUserProfiles(profiles);
      } catch (error) {
        console.error("Error fetching user directory:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userAddress) {
      getUsers();
    }
  }, [userAddress]);

  if (loading) {
    return (
      <div className="bg-theme-secondary-muted p-4 rounded-lg">
        <h2 className="text-xl mb-4">Loading users...</h2>
      </div>
    );
  }

  return (
    <div className="bg-theme-secondary-muted p-4 rounded-lg">
      <h2 className="text-xl mb-4">User Directory</h2>
      <div className="flex flex-col gap-2">
        {sampleAddresses.length === 0 ? (
          <p className="text-theme-primary">No users found</p>
        ) : (
          sampleAddresses.map((address) => (
            <Link
              key={address}
              href={`/profile/${address}`}
              className="p-2 bg-theme-secondary rounded-lg hover:bg-theme-primary/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-theme-splitter"></div>
                <div>
                  <p className="font-medium">
                    {userProfiles[address]?.username || "Unknown User"}
                  </p>
                  <p className="text-sm text-theme-primary">
                    {truncateAddress(address)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
