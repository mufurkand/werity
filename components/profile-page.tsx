"use client";

import PostContainer from "@/components/post-container";
import PostControls from "@/components/post-controls";
import ProfileMain from "@/components/profile-main";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { ExternalLink, LandPlot, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { type UserProfile } from "@/lib/blockchain/contracts";
import { PostType } from "@/types/posts";
import Post from "./post-container/post";
import DisplayPost from "./display-post";
import CommentContainer from "./comment-container";
import NFTCollection from "./profile-main/nft-collection";

interface ProfilePageProps {
  userAddress?: string;
}

export default function ProfilePage({ userAddress }: ProfilePageProps) {
  const { userProfile: contextUserProfile, userAddress: currentUserAddress, isInitializing } =
    useBlockchain();
  const [externalUserProfile, setExternalUserProfile] =
    useState<UserProfile | null>(null);
  const [viewType, setViewType] = useState<"posts" | "comments" | "nfts">("posts");

  const userProfile = userAddress ? externalUserProfile : contextUserProfile;
  const [loading, setLoading] = useState(!!userAddress);
  const [displayPosts, setDisplayPosts] = useState<PostType[]>([]);
  const [displayLoading, setDisplayLoading] = useState(true);

  // Use the provided userAddress or fall back to currentUserAddress
  // This ensures comments/posts will load properly even on the static /profile route
  const effectiveUserAddress = userAddress || currentUserAddress || "";

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

  // Load NFT posts for display section
  useEffect(() => {
    if (effectiveUserAddress) {
      loadDisplayPosts();
    }
  }, [effectiveUserAddress]);

  const loadDisplayPosts = async () => {
    try {
      setDisplayLoading(true);
      // Get NFT post IDs owned by the user
      const nftPostIds = await blockchainService.getNFTPostsByUser(effectiveUserAddress);
      
      if (nftPostIds.length === 0) {
        setDisplayPosts([]);
        return;
      }

      // Load details for each NFT post (limit to first 6 for display)
      const limitedPostIds = nftPostIds.slice(0, 6);
      const nftPostDetails = await Promise.all(
        limitedPostIds.map(async (postId) => {
          try {
            const post = await blockchainService.getPost(postId);
            if (!post) return null;

            return {
              id: postId,
              ...post,
              isLikedByUser: false,
              isNFT: true,
            };
          } catch (error) {
            console.error(`Error loading NFT post ${postId}:`, error);
            return null;
          }
        })
      );

      setDisplayPosts(nftPostDetails.filter((post) => post !== null) as PostType[]);
    } catch (error) {
      console.error('Error loading display posts:', error);
    } finally {
      setDisplayLoading(false);
    }
  };


  // Show loading state while checking for existing session (only for own profile)
  if (!userAddress && isInitializing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="h-8 w-48 bg-theme-splitter rounded animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-theme-splitter rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

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
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x max-w-full scrollbar-hide">
          {displayLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="relative bg-gradient-to-br from-theme-primary-muted to-theme-secondary-muted p-5 flex flex-col gap-4 rounded-xl min-w-[320px] max-w-md flex-shrink-0 snap-start border border-theme-splitter/30 animate-pulse"
              >
                {/* NFT Badge skeleton */}
                <div className="absolute top-3 right-3 bg-theme-splitter w-12 h-6 rounded-full"></div>
                
                {/* Author Info skeleton */}
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-theme-splitter w-12 h-12 ring-2 ring-theme-accent/20"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-theme-splitter rounded w-24 mb-1"></div>
                    <div className="h-3 bg-theme-splitter rounded w-20"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-3 bg-theme-splitter rounded w-16"></div>
                  </div>
                </div>

                {/* Content skeleton */}
                <div className="relative">
                  <div className="rounded-lg w-20 h-28 bg-theme-splitter float-right ml-3 mb-2"></div>
                  <div className="space-y-2 pr-2">
                    <div className="h-3 bg-theme-splitter rounded w-full"></div>
                    <div className="h-3 bg-theme-splitter rounded w-full"></div>
                    <div className="h-3 bg-theme-splitter rounded w-3/4"></div>
                  </div>
                </div>

                {/* Stats & Ownership skeleton */}
                <div className="flex items-center justify-between pt-2 border-t border-theme-splitter/30">
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-theme-splitter rounded w-8"></div>
                    <div className="h-4 bg-theme-splitter rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-theme-splitter rounded w-20"></div>
                </div>
              </div>
            ))
          ) : displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <DisplayPost key={post.id} post={post} />
            ))
          ) : (
            <div className="relative bg-gradient-to-br from-theme-primary-muted to-theme-secondary-muted p-5 flex flex-col gap-4 rounded-xl min-w-[320px] max-w-md flex-shrink-0 snap-start border border-theme-splitter/30 items-center justify-center h-60">
              <div className="text-center">
                <Tag size={32} className="text-theme-accent mx-auto mb-2 opacity-50" />
                <p className="text-theme-primary font-medium">No NFT posts to display</p>
                <p className="text-xs text-theme-primary/70 mt-1">Purchase posts to see them here</p>
              </div>
            </div>
          )}
        </div>
      </div>{" "}
      <div className="p-8 flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            className={`p-2 rounded-md outline outline-theme-primary ${
              viewType === "posts" ? "bg-theme-primary text-black" : ""
            }`}
            onClick={() => setViewType("posts")}
          >
            Posts
          </button>
          <button
            className={`p-2 rounded-md outline outline-theme-primary ${
              viewType === "comments" ? "bg-theme-primary text-black" : ""
            }`}
            onClick={() => setViewType("comments")}
          >
            Comments
          </button>
          <button
            className={`p-2 rounded-md outline outline-theme-primary ${
              viewType === "nfts" ? "bg-theme-primary text-black" : ""
            }`}
            onClick={() => setViewType("nfts")}
          >
            NFT Collection
          </button>
        </div>
        <div className="w-0.5 bg-theme-splitter h-8"></div>
        <div className="flex gap-1 items-center">
          <p>Settings</p>
          <ExternalLink />
        </div>
      </div>{" "}
      <div className="flex p-8 gap-4">
        {viewType === "posts" ? (
          <PostContainer userId={effectiveUserAddress || undefined} />
        ) : viewType === "comments" ? (
          <CommentContainer
            user={effectiveUserAddress || undefined}
            showCommentInput={false}
          />
        ) : (
          <NFTCollection address={effectiveUserAddress} />
        )}
        <PostControls />
        <div className="w-64 h-96 rounded-lg bg-theme-secondary-muted flex justify-center items-center">
          <LandPlot size={64} strokeWidth={1} />
        </div>
      </div>
    </div>
  );
}
