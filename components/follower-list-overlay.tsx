"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { truncateAddress } from "@/lib/utils/addressFormat";
import blockchainService from "@/lib/blockchain/contracts";
import { type UserProfile as UserProfileType } from "@/lib/blockchain/contracts";
import Link from "next/link";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfiles = async () => {
      if (!addresses.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const profiles: Record<string, UserProfileType | null> = {};

      // Load profiles for all addresses
      await Promise.all(
        addresses.map(async (address) => {
          try {
            const profile = await blockchainService.getUserProfile(address);
            profiles[address] = profile;
          } catch (error) {
            console.error(`Error loading profile for ${address}:`, error);
            profiles[address] = null;
          }
        })
      );

      setUserProfiles(profiles);
      setLoading(false);
    };

    if (isOpen) {
      loadUserProfiles();
    }
  }, [addresses, isOpen]);

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
                  <div className="rounded-full h-10 w-10 bg-theme-splitter flex-shrink-0"></div>
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
