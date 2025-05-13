"use client";

import React, { useState, useEffect } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { twJoin } from "tailwind-merge";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreatePostProps {
  onPostCreated?: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { isConnected } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postCreated, setPostCreated] = useState(false);
  const router = useRouter();

  // Handle redirection after post creation
  useEffect(() => {
    if (postCreated) {
      // Using setTimeout to ensure this happens in the next event loop cycle
      const timeoutId = setTimeout(() => {
        router.push("/");
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [postCreated, router]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!newPostContent.trim()) {
      alert("Please enter post content");
      return;
    }

    try {
      setLoading(true);
      const postId = await blockchainService.createPost(newPostContent);

      if (postId !== null) {
        // Clear input and call the callback if provided
        setNewPostContent("");
        setPostCreated(true);
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        alert("Failed to create post");
      }
    } catch (error: Error | unknown) {
      console.error("Error creating post:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  // Show success message if post was created
  if (postCreated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <p>Created post! Redirecting...</p>
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 h-[calc(100vh-3.5rem)]">
      <div className="bg-theme-secondary-muted rounded-lg p-6 w-full max-w-md shadow-lg">
        <form onSubmit={handleCreatePost} className="space-y-4">
          <h3 className="text-xl font-bold text-theme-primary mb-4">
            Create a New Post
          </h3>

          <div className="space-y-2">
            <label className="block text-theme-primary font-medium">
              Content
            </label>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Enter content IPFS URI or direct text content"
              rows={5}
              required
              className="w-full p-2 border border-theme-secondary-muted rounded-md bg-theme-bg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={twJoin(
              "w-full py-2 px-4 rounded-md font-medium transition-colors",
              loading
                ? "bg-theme-secondary-muted text-theme-primary cursor-not-allowed"
                : "bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              "Create Post"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
