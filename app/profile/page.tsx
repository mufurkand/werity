"use client";

import Post from "@/components/post";
import PostContainer from "@/components/post-container";
import PostControls from "@/components/post-controls";
import ProfileButtons from "@/components/profile-buttons";
import ProfileMain from "@/components/profile-main";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { ExternalLink, LandPlot } from "lucide-react";

export default function Profile() {
  const { userProfile } = useBlockchain();

  // TODO: early return if userProfile is not loaded

  return (
    <div className="w-full flex flex-col">
      <ProfileMain />
      <div className="bg-theme-secondary-muted w-full p-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <p className="text-2xl font-semibold">
            {userProfile?.username}&apos;s
          </p>
          <p className="text-theme-primary text-2xl font-semibold">Display</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x max-w-full">
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
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
