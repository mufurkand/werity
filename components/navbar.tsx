"use client";

import { ChevronDown, ChevronUp, PenTool, User, LogOut, Wallet } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { fetchIPFSImage, ipfsUriToHash } from "@/lib/utils/ipfsService";
import { truncateAddress } from "@/lib/utils/addressFormat";

interface NavDropdownLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavDropdownLink({ href, children, onClick }: NavDropdownLinkProps) {
  return (
    <Link
      className="flex gap-3 items-center hover:bg-theme-secondary-muted/30 hover:text-theme-accent p-3 rounded-lg transition-all duration-200 text-theme-primary/70 group"
      href={href}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { userProfile, isInitializing, userAddress } = useBlockchain();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-16 px-4 mt-4 flex gap-4 items-center border-b border-theme-splitter/20 justify-between bg-gradient-to-r from-theme-background to-theme-secondary-muted/20 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="size-8 hover:bg-theme-secondary-muted/50 rounded-lg transition-colors duration-200" />
        <div className="border-r border-theme-splitter/30 w-[1px] h-6"></div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-theme-accent rounded-full"></div>
          <p className="font-semibold text-theme-text">Home</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {userProfile && userProfile.exists && (
          <Link
            className="group flex items-center justify-center w-12 h-12 bg-gradient-to-br from-theme-accent/20 to-theme-accent/40 hover:from-theme-accent/30 hover:to-theme-accent/60 border border-theme-accent/30 hover:border-theme-accent/50 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-theme-accent/20 hover:scale-110"
            href="/post/create"
            title="Create Post"
          >
            <PenTool size={18} className="text-theme-accent group-hover:text-theme-accent group-hover:rotate-12 transition-all duration-300" />
          </Link>
        )}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="group flex items-center gap-3 p-2 pr-3 bg-gradient-to-r from-theme-secondary/80 to-theme-secondary/60 hover:from-theme-secondary hover:to-theme-secondary/80 border border-theme-splitter/20 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 min-w-[200px]"
            disabled={isInitializing}
          >
            {isInitializing ? (
              // Loading state
              <>
                <div className="rounded-full h-10 w-10 bg-theme-splitter/50 animate-pulse flex-shrink-0"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-theme-splitter/50 rounded w-16 animate-pulse"></div>
                  <div className="h-2 bg-theme-splitter/30 rounded w-20 animate-pulse"></div>
                </div>
                <div className="w-4 h-4 bg-theme-splitter/50 rounded animate-pulse"></div>
              </>
            ) : (
              <>
                                  <div className="relative flex-shrink-0">
                    {profileImageUrl ? (
                      <img 
                        src={profileImageUrl} 
                        alt="Profile" 
                        className="rounded-full h-10 w-10 object-cover ring-2 ring-theme-accent/30 group-hover:ring-theme-accent/50 transition-all duration-300"
                        onError={() => setProfileImageUrl(null)}
                      />
                    ) : (
                      <div className="rounded-full h-10 w-10 bg-gradient-to-br from-theme-accent/30 to-theme-accent/60 flex items-center justify-center ring-2 ring-theme-accent/30 group-hover:ring-theme-accent/50 transition-all duration-300">
                        <User size={20} className="text-theme-accent" />
                      </div>
                    )}
                  </div>
                
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-theme-text text-sm truncate group-hover:text-theme-accent transition-colors duration-300">
                    {userProfile && userProfile.exists
                      ? userProfile.username
                      : "Guest"}
                  </p>
                  {userAddress && (
                    <div className="flex items-center gap-1 text-xs text-theme-primary/70">
                      <Wallet size={10} />
                      <span className="font-mono">{truncateAddress(userAddress)}</span>
                    </div>
                  )}
                </div>
                
                <ChevronDown 
                  size={16} 
                  className={twJoin(
                    "text-theme-primary/70 group-hover:text-theme-accent transition-all duration-300",
                    open ? "rotate-180" : "rotate-0"
                  )} 
                />
              </>
            )}
          </button>
          
          {!isInitializing && (
            <div
              className={twJoin(
                "absolute right-0 top-full mt-2 w-64 bg-gradient-to-br from-theme-background/95 to-theme-secondary/90 backdrop-blur-xl border border-theme-splitter/20 rounded-xl shadow-2xl transition-all duration-300 transform origin-top-right overflow-hidden",
                open
                  ? "scale-100 opacity-100 visible"
                  : "scale-95 opacity-0 invisible"
              )}
            >
              {userProfile && userProfile.exists ? (
                <div className="p-2">
                  {/* Profile Header */}
                  <div className="p-4 border-b border-theme-splitter/20 bg-gradient-to-r from-theme-accent/5 to-transparent">
                    <div className="flex items-center gap-3">
                      {profileImageUrl ? (
                        <img 
                          src={profileImageUrl} 
                          alt="Profile" 
                          className="rounded-full h-12 w-12 object-cover ring-2 ring-theme-accent/30"
                          onError={() => setProfileImageUrl(null)}
                        />
                      ) : (
                        <div className="rounded-full h-12 w-12 bg-gradient-to-br from-theme-accent/30 to-theme-accent/60 flex items-center justify-center ring-2 ring-theme-accent/30">
                          <User size={24} className="text-theme-accent" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-theme-text truncate">{userProfile.username}</p>
                        {userProfile.bio && (
                          <p className="text-xs text-theme-primary/70 truncate">{userProfile.bio}</p>
                        )}
                        {userAddress && (
                          <div className="flex items-center gap-1 text-xs text-theme-primary/60 mt-1">
                            <Wallet size={10} />
                            <span className="font-mono">{truncateAddress(userAddress)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="py-2 space-y-1">
                    <NavDropdownLink href="/profile" onClick={() => setOpen(false)}>
                      <User size={16} />
                      <span>View Profile</span>
                    </NavDropdownLink>
                    <div className="border-t border-theme-splitter/20 my-2"></div>
                    <button
                      onClick={() => {
                        setOpen(false);
                        // Add logout functionality here
                      }}
                      className="w-full flex gap-2 items-center hover:bg-red-500/10 hover:text-red-400 p-2 rounded-lg transition-all duration-200 text-theme-primary/70"
                    >
                      <LogOut size={16} />
                      <span>Disconnect</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <NavDropdownLink href="/auth" onClick={() => setOpen(false)}>
                    <User size={16} />
                    <span>Login / Register</span>
                  </NavDropdownLink>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
