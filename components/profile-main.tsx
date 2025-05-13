import { UserPlus } from "lucide-react";
import Wallet from "./profile-main/wallet";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { useEffect, useState } from "react";
import blockchainService from "@/lib/blockchain/contracts";

export default function ProfileMain() {
  const { userProfile, userAddress } = useBlockchain();

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (userAddress) {
      loadFollowData();
    }
  }, [userAddress]);

  async function loadFollowData() {
    if (!userAddress) return;

    try {
      const followersList = await blockchainService.getFollowers(userAddress);
      const followingList = await blockchainService.getFollowing(userAddress);

      setFollowers(followersList.length);
      setFollowing(followingList.length);
    } catch (error) {
      console.error("Error loading follow data:", error);
    } finally {
    }
  }

  return (
    <div className="flex justify-around items-center p-8 gap-8">
      {/* profile */}
      <div className="flex gap-4 flex-col">
        <div className="flex gap-4">
          <div className="rounded-full h-24 w-24 bg-theme-splitter"></div>
          <div className="flex flex-col justify-center gap-2">
            <div>
              <h1 className="text-2xl font-bold">{userProfile?.username}</h1>
              <p className="text-theme-primary">@{userProfile?.username}</p>
            </div>
            <button className="bg-theme-secondary rounded-md flex gap-2 items-center justify-center p-1">
              <UserPlus />
              <p>Follow</p>
            </button>
          </div>
        </div>
        <p className="text-theme-primary">{userProfile?.bio}</p>
      </div>
      {/* wallet */}
      <Wallet />
    </div>
  );
}
