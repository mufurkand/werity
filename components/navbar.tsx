"use client";

import { ChevronDown, ChevronUp, SquarePen, User } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { fetchIPFSImage, ipfsUriToHash } from "@/lib/utils/ipfsService";

interface NavDropdownLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function NavDropdownLink({ href, children, onClick }: NavDropdownLinkProps) {
  return (
    <Link
      className="flex gap-2 items-center hover:bg-theme-tertiary p-1 rounded-sm transition-colors"
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
  const { userProfile } = useBlockchain();
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
          setProfileImageUrl(imageUrl);
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
    <div className="h-14 px-2 flex gap-2 items-center border-b border-theme-splitter justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-8" />
        <div className="border-r border-theme-splitter w-[1px] h-6"></div>
        <p className="ml-2">Home</p>
      </div>{" "}
      <div className="flex items-center gap-2">
        {userProfile && userProfile.exists && (
          <Link
            className="bg-theme-accent p-2 rounded-full"
            href="/post/create"
          >
            <SquarePen size={20} />
          </Link>
        )}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex p-2 px-4 gap-2 bg-theme-secondary transition-all duration-75 rounded-md items-center"
          >
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="rounded-full h-6 w-6 object-cover"
                onError={() => setProfileImageUrl(null)}
              />
            ) : (
              <User />
            )}
            <p>
              {userProfile && userProfile.exists
                ? userProfile.username
                : "Guest"}
            </p>
            {open ? <ChevronUp /> : <ChevronDown />}
          </button>
          <div
            className={twJoin(
              "absolute w-full top-full mt-1 transition-all duration-150 ease-linear transform scale-80 bg-theme-secondary rounded-md px-4 opacity-0 invisible",
              open
                ? "scale-100 py-2 opacity-100 visible"
                : "scale-80 opacity-0 invisible"
            )}
          >
            {userProfile && userProfile.exists ? (
              <NavDropdownLink href="/profile" onClick={() => setOpen(false)}>
                Profile
              </NavDropdownLink>
            ) : (
              <NavDropdownLink href="/auth" onClick={() => setOpen(false)}>
                Login
              </NavDropdownLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
