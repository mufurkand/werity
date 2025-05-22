"use client";

import { X, User } from "lucide-react";
import { useEffect, useState } from "react";
import { truncateAddress } from "@/lib/utils/addressFormat";
import blockchainService from "@/lib/blockchain/contracts";
import { type UserProfile as UserProfileType } from "@/lib/blockchain/contracts";
import Link from "next/link";
import { getCachedProfile, getCachedProfileImageUrl, requestProfileImage } from "@/lib/utils/profileCache";

interface FollowerListOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  addresses: string[];
  title: string;
}

export default function FollowerListOverlay({
  isOpen,
  onClose,
  addresses,
  title,
}: FollowerListOverlayProps) {
  const [userProfiles, setUserProfiles] = useState<
    Record<string, UserProfileType | null>
  >({});
  const [profileImages, setProfileImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfiles = async () => {
      if (!addresses.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const profiles: Record<string, UserProfileType | null> = {};
      const images: Record<string, string | null> = {};

      // Load profiles for all addresses using cache
      await Promise.all(
        addresses.map(async (address) => {
          try {
            const profile = await getCachedProfile(address, () => {
              return blockchainService.getUserProfile(address);
            });
            
            profiles[address] = profile;
            
            // Request profile image loading if available
            if (profile?.profilePhotoIPFS) {
              await requestProfileImage(address, profile.profilePhotoIPFS);
            }
            
            images[address] = getCachedProfileImageUrl(address);
          } catch (error) {
            console.error(`Error loading profile for ${address}:`, error);
            profiles[address] = null;
            images[address] = null;
          }
        })
      );

      setUserProfiles(profiles);
      setProfileImages(images);
      setLoading(false);
    };

    if (isOpen) {
      loadUserProfiles();
      
      // Set up periodic check for image URLs
      const checkImagesInterval = setInterval(() => {
        const newImages: Record<string, string | null> = {};
        let hasChanges = false;
        
        addresses.forEach(address => {
          const cachedUrl = getCachedProfileImageUrl(address);
          newImages[address] = cachedUrl;
          if (cachedUrl !== profileImages[address]) {
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          setProfileImages(newImages);
        }
      }, 500);
      
      return () => clearInterval(checkImagesInterval);
    }
  }, [addresses, isOpen, profileImages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-theme-background rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-theme-splitter flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-theme-secondary-muted"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : addresses.length === 0 ? (
            <div className="p-4 text-center text-theme-primary">
              No users found
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {addresses.map((address) => (
                <Link
                  href={`/profile/${address}`}
                  key={address}
                  className="flex items-center gap-3 p-3 hover:bg-theme-secondary-muted rounded-md"
                  onClick={onClose}
                >
                  {profileImages[address] ? (
                    <img 
                      src={profileImages[address] || ''} 
                      alt={`${userProfiles[address]?.username || 'User'}'s profile`}
                      className="rounded-full h-10 w-10 object-cover flex-shrink-0"
                      onError={(e) => {
                        // Set to null if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const newImages = { ...profileImages };
                        newImages[address] = null;
                        setProfileImages(newImages);
                      }}
                    />
                  ) : (
                    <div className="rounded-full h-10 w-10 bg-theme-splitter flex-shrink-0 flex items-center justify-center">
                      <User size={20} className="text-theme-primary" />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-medium truncate">
                      {userProfiles[address]?.username || "Unknown User"}
                    </span>
                    <span className="text-theme-primary text-sm">
                      {truncateAddress(address)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
