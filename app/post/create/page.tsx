"use client";

import React, { useState, useEffect, useRef } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { twJoin } from "tailwind-merge";
import { Image, Loader, X, FileVideo } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadMultipleToIPFS, formatPostContent } from "@/lib/utils/ipfsService";

interface CreatePostProps {
  onPostCreated?: () => void;
}

// Maximum number of media files allowed
const MAX_MEDIA_FILES = 3;

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { isConnected } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [postCreated, setPostCreated] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Create object URLs for previews when media files change
  useEffect(() => {
    // Clean up previous preview URLs
    mediaPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    // Create new preview URLs
    const urls = mediaFiles.map(file => URL.createObjectURL(file));
    setMediaPreviewUrls(urls);
    
    // Clean up on unmount
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [mediaFiles]);

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

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Check if adding the new files would exceed the limit
    if (mediaFiles.length + newFiles.length > MAX_MEDIA_FILES) {
      alert(`You can upload a maximum of ${MAX_MEDIA_FILES} media files.`);
      return;
    }
    
    // Add new files to the existing files
    setMediaFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    // Clear the input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    // Remove file and its preview URL
    setMediaFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    
    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(mediaPreviewUrls[index]);
    setMediaPreviewUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!newPostContent.trim() && mediaFiles.length === 0) {
      alert("Please enter post content or add media");
      return;
    }

    try {
      setLoading(true);
      
      // Upload media files to IPFS if any
      let finalContent = newPostContent;
      if (mediaFiles.length > 0) {
        setUploadingMedia(true);
        const uploadResults = await uploadMultipleToIPFS(mediaFiles);
        const hashes = uploadResults.map(result => result.Hash);
        
        // Format the post content with text and IPFS references
        finalContent = formatPostContent(newPostContent, hashes);
        setUploadingMedia(false);
      }
      
      // Create the post
      const postId = await blockchainService.createPost(finalContent);

      if (postId !== null) {
        // Clear input and call the callback if provided
        setNewPostContent("");
        setMediaFiles([]);
        setMediaPreviewUrls([]);
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
      setUploadingMedia(false);
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
              placeholder="What's on your mind?"
              rows={5}
              className="w-full p-2 border border-theme-secondary-muted rounded-md bg-theme-bg text-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-accent resize-none"
            />
          </div>

          {/* Media upload section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-theme-primary font-medium">
                Media
              </label>
              <span className="text-sm text-theme-primary">
                {mediaFiles.length}/{MAX_MEDIA_FILES}
              </span>
            </div>
            
            {/* Media preview grid */}
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                {mediaPreviewUrls.map((url, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden aspect-square">
                    {mediaFiles[index].type.startsWith('image/') ? (
                      <img 
                        src={url} 
                        alt={`Media ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-theme-secondary flex items-center justify-center">
                        <FileVideo size={32} className="text-theme-primary" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-1 right-1 bg-theme-secondary/80 rounded-full p-0.5"
                    >
                      <X size={16} className="text-theme-primary" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            {mediaFiles.length < MAX_MEDIA_FILES && (
              <button
                type="button"
                onClick={triggerFileInput}
                className="flex items-center justify-center gap-2 w-full p-2 border-2 border-dashed border-theme-secondary rounded-md hover:bg-theme-secondary/10 transition-colors"
              >
                <Image size={20} className="text-theme-primary" />
                <span className="text-theme-primary">Add photos or videos</span>
              </button>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaUpload}
              accept="image/*,video/*"
              className="hidden"
              multiple
            />
          </div>

          <button
            type="submit"
            disabled={loading || uploadingMedia}
            className={twJoin(
              "w-full py-2 px-4 rounded-md font-medium transition-colors",
              (loading || uploadingMedia)
                ? "bg-theme-secondary-muted text-theme-primary cursor-not-allowed"
                : "bg-theme-accent text-theme-bg hover:bg-theme-accent/90"
            )}
          >
            {loading || uploadingMedia ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                {uploadingMedia ? "Uploading media..." : "Creating..."}
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
