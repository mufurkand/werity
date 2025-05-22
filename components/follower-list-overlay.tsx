"use client";

import { X, User, Search, Users, UserPlus } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredAddresses, setFilteredAddresses] = useState<string[]>([]);

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
    }
  }, [addresses, isOpen]);

  // Separate effect for checking image updates
  useEffect(() => {
    if (!isOpen || !addresses.length) return;

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
  }, [addresses, isOpen]); // Removed profileImages from dependency array

  // Filter addresses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAddresses(addresses);
    } else {
      const filtered = addresses.filter((address) => {
        const profile = userProfiles[address];
        const username = profile?.username?.toLowerCase() || '';
        const addressLower = address.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return username.includes(query) || addressLower.includes(query);
      });
      setFilteredAddresses(filtered);
    }
  }, [searchQuery, addresses, userProfiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-theme-background/95 to-theme-secondary-muted/90 backdrop-blur-xl border border-theme-splitter/30 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative p-6 border-b border-theme-splitter/20 bg-gradient-to-r from-theme-accent/10 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {title.toLowerCase().includes('following') ? (
                <UserPlus className="text-theme-accent" size={24} />
              ) : (
                <Users className="text-theme-accent" size={24} />
              )}
              <div>
                <h2 className="text-2xl font-bold text-theme-text">{title}</h2>
                <p className="text-sm text-theme-primary/70">
                  {addresses.length} {addresses.length === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-theme-secondary-muted/50 transition-all duration-200 hover:scale-110 group"
            >
              <X size={20} className="text-theme-primary group-hover:text-theme-text transition-colors" />
            </button>
          </div>
          
          {/* Search Bar */}
          {addresses.length > 0 && (
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-primary/50" size={18} />
              <input
                type="text"
                placeholder="Search by username or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-theme-secondary-muted/50 border border-theme-splitter/30 rounded-xl text-theme-text placeholder-theme-primary/50 focus:outline-none focus:ring-2 focus:ring-theme-accent/50 focus:border-theme-accent/50 transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                  <div className="rounded-full bg-theme-splitter/30 w-12 h-12 flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-theme-splitter/30 rounded w-32"></div>
                    <div className="h-3 bg-theme-splitter/20 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-theme-secondary-muted/50 p-6 mb-4">
                <Users size={32} className="text-theme-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text mb-2">No users yet</h3>
              <p className="text-theme-primary/70 text-sm">
                {title.toLowerCase().includes('following') 
                  ? "Start following people to see them here" 
                  : "No one is following this user yet"}
              </p>
            </div>
          ) : filteredAddresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-theme-secondary-muted/50 p-6 mb-4">
                <Search size={32} className="text-theme-primary/50" />
              </div>
              <h3 className="text-lg font-semibold text-theme-text mb-2">No matches found</h3>
              <p className="text-theme-primary/70 text-sm">
                Try searching with a different term
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {filteredAddresses.map((address) => (
                <Link
                  href={`/profile/${address}`}
                  key={address}
                  className="flex items-center gap-4 p-4 hover:bg-theme-secondary-muted/30 rounded-xl transition-all duration-200 hover:scale-[1.02] group border border-transparent hover:border-theme-accent/20"
                  onClick={onClose}
                >
                  <div className="relative">
                    {profileImages[address] ? (
                      <img 
                        src={profileImages[address] || ''} 
                        alt={`${userProfiles[address]?.username || 'User'}'s profile`}
                        className="rounded-full h-12 w-12 object-cover flex-shrink-0 ring-2 ring-theme-accent/20 group-hover:ring-theme-accent/40 transition-all duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const newImages = { ...profileImages };
                          newImages[address] = null;
                          setProfileImages(newImages);
                        }}
                      />
                    ) : (
                      <div className="rounded-full h-12 w-12 bg-gradient-to-br from-theme-accent/20 to-theme-accent/40 flex-shrink-0 flex items-center justify-center ring-2 ring-theme-accent/20 group-hover:ring-theme-accent/40 transition-all duration-200">
                        <User size={20} className="text-theme-accent" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-theme-background"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-theme-text truncate group-hover:text-theme-accent transition-colors duration-200">
                        {userProfiles[address]?.username || "Unknown User"}
                      </span>
                      {userProfiles[address]?.bio && (
                        <div className="w-1 h-1 bg-theme-primary/50 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-theme-primary/70 text-sm font-mono">
                        {truncateAddress(address)}
                      </span>
                    </div>
                    {userProfiles[address]?.bio && (
                      <p className="text-xs text-theme-primary/60 mt-1 line-clamp-1">
                        {userProfiles[address]?.bio}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-theme-primary/40 group-hover:text-theme-accent transition-colors duration-200">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        {!loading && filteredAddresses.length > 0 && (
          <div className="p-4 border-t border-theme-splitter/20 bg-theme-secondary-muted/20">
            <p className="text-center text-xs text-theme-primary/60">
              Showing {filteredAddresses.length} of {addresses.length} {addresses.length === 1 ? 'user' : 'users'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
