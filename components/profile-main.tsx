import { UserPlus, Check, User } from "lucide-react";
import Wallet from "./profile-main/wallet";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { useEffect, useState, useCallback } from "react";
import blockchainService from "@/lib/blockchain/contracts";
import { truncateAddress } from "@/lib/utils/addressFormat";
import { type UserProfile as UserProfileType } from "@/lib/blockchain/contracts";
import FollowerListOverlay from "./follower-list-overlay";
import { fetchIPFSImage, ipfsUriToHash } from "@/lib/utils/ipfsService";

interface ProfileMainProps {
  targetAddress?: string;
}

export default function ProfileMain({ targetAddress }: ProfileMainProps) {
  const { userProfile: contextUserProfile, userAddress: contextUserAddress } =
    useBlockchain();

  // Use the provided targetAddress if available, otherwise use the context one
  const userAddress = targetAddress || contextUserAddress;

  const [externalUserProfile, setExternalUserProfile] =
    useState<UserProfileType | null>(null);
  const userProfile = targetAddress ? externalUserProfile : contextUserProfile;

  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // State for follower list overlay
  const [followersList, setFollowersList] = useState<string[]>([]);
  const [followingList, setFollowingList] = useState<string[]>([]);
  const [showFollowersOverlay, setShowFollowersOverlay] = useState(false);
  const [showFollowingOverlay, setShowFollowingOverlay] = useState(false);

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const loadFollowData = useCallback(async () => {
    if (!userAddress) return;

    try {
      const followers = await blockchainService.getFollowers(userAddress);
      const following = await blockchainService.getFollowing(userAddress);

      setFollowersList(followers);
      setFollowingList(following);
      setFollowers(followers.length);
      setFollowing(following.length);
    } catch (error) {
      console.error("Error loading follow data:", error);
    }
  }, [userAddress]);

  useEffect(() => {
    // Load the external user profile if targetAddress is provided
    if (targetAddress) {
      const fetchUserProfile = async () => {
        const profile = await blockchainService.getUserProfile(targetAddress);
        setExternalUserProfile(profile);
      };

      fetchUserProfile();
    }
  }, [targetAddress]);

  useEffect(() => {
    if (userAddress) {
      loadFollowData();
    }
  }, [userAddress, loadFollowData]);

  // Check if current user is following the target user
  useEffect(() => {
    if (
      targetAddress &&
      contextUserAddress &&
      targetAddress !== contextUserAddress
    ) {
      const checkFollowStatus = async () => {
        try {
          const following = await blockchainService.isFollowing(
            contextUserAddress,
            targetAddress
          );
          setIsFollowing(following);
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      };

      checkFollowStatus();
    }
  }, [targetAddress, contextUserAddress]);

  // Function to load and prepare profile image from IPFS
  useEffect(() => {
    async function loadProfileImage() {
      if (!userProfile?.profilePhotoIPFS) {
        setProfileImageUrl(null);
        return;
      }

      try {
        const hash = ipfsUriToHash(userProfile.profilePhotoIPFS);
        if (hash && hash !== 'default') {
          // Use async fetchIPFSImage to get a data URL
          const imageUrl = await fetchIPFSImage(hash);
          // Only set if imageUrl is not null
          if (imageUrl) {
            setProfileImageUrl(imageUrl);
          } else {
            setProfileImageUrl(null);
          }
        } else {
          setProfileImageUrl(null);
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
        setProfileImageUrl(null);
      }
    }

    loadProfileImage();

    // Clean up the object URL when component unmounts or profile changes
    return () => {
      if (profileImageUrl) {
        URL.revokeObjectURL(profileImageUrl);
      }
    };
  }, [userProfile]);

  const handleFollowToggle = async () => {
    if (
      !targetAddress ||
      !contextUserAddress ||
      targetAddress === contextUserAddress
    )
      return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        // Unfollow the user
        await blockchainService.unfollowUser(targetAddress);
      } else {
        // Follow the user
        await blockchainService.followUser(targetAddress);
      }

      // Toggle the following state
      setIsFollowing(!isFollowing);

      // Refresh follow data counts
      loadFollowData();
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-around items-center p-8 gap-8">
        {/* profile */}
        <div className="flex gap-4 flex-col">
          <div className="flex gap-4">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={`${userProfile?.username}'s profile`}
                className="rounded-full h-24 w-24 object-cover" 
                onError={() => setProfileImageUrl(null)}
              />
            ) : (
              <div className="rounded-full h-24 w-24 bg-theme-splitter flex items-center justify-center">
                <User size={40} className="text-theme-primary" />
              </div>
            )}
            <div className="flex flex-col justify-center gap-2">
              {" "}
              <div>
                <h1 className="text-2xl font-bold">{userProfile?.username}</h1>
                <p className="text-theme-primary">
                  {truncateAddress(userAddress)}
                </p>
              </div>
              {targetAddress && targetAddress !== contextUserAddress && (
                <button
                  className={`rounded-md flex gap-2 items-center justify-center p-1 ${
                    followLoading
                      ? "bg-theme-secondary-muted cursor-not-allowed"
                      : isFollowing
                      ? "bg-theme-primary"
                      : "bg-theme-secondary hover:bg-theme-secondary/90"
                  }`}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {isFollowing ? <Check size={16} /> : <UserPlus size={16} />}
                  <p>{isFollowing ? "Following" : "Follow"}</p>
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowFollowersOverlay(true)}
              className="text-theme-primary hover:underline flex items-center gap-1"
            >
              <span className="font-semibold">{followers}</span> followers
            </button>
            <button
              onClick={() => setShowFollowingOverlay(true)}
              className="text-theme-primary hover:underline flex items-center gap-1"
            >
              <span className="font-semibold">{following}</span> following
            </button>
          </div>
          <p className="text-theme-primary">{userProfile?.bio}</p>
        </div>{" "}
        {/* wallet */}
        <Wallet targetAddress={targetAddress} />
      </div>

      {/* Follower list overlays */}
      <FollowerListOverlay
        isOpen={showFollowersOverlay}
        onClose={() => setShowFollowersOverlay(false)}
        addresses={followersList}
        title="Followers"
      />

      <FollowerListOverlay
        isOpen={showFollowingOverlay}
        onClose={() => setShowFollowingOverlay(false)}
        addresses={followingList}
        title="Following"
      />
    </>
  );
}
