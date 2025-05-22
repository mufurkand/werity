import { PostType } from "@/types/posts";
import { ArrowBigUp, Loader, Trash2, User, Image as ImageIcon, FileVideo } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { twJoin } from "tailwind-merge";
import { useState, useEffect } from "react";
import blockchainService from "@/lib/blockchain/contracts";
import { getCachedProfile, getCachedProfileImageUrl, requestProfileImage } from "@/lib/utils/profileCache";
import { parsePostContent, fetchIPFSImage } from "@/lib/utils/ipfsService";

type PostProps = {
  post: PostType;
  onLike: (postId: number, alreadyLiked: boolean) => Promise<void>;
  loading: boolean;
  isPage?: boolean;
  onDelete?: (postId: number) => void;
};

export default function Post({
  post,
  onLike,
  loading,
  isPage,
  onDelete,
}: PostProps) {
  const router = useRouter();
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [parsedContent, setParsedContent] = useState<{ text: string, mediaHashes: string[] }>({ text: '', mediaHashes: [] });
  const [mediaUrls, setMediaUrls] = useState<(string | null)[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  // Parse post content to extract text and media references
  useEffect(() => {
    if (post?.contentIPFS) {
      const parsed = parsePostContent(post.contentIPFS);
      setParsedContent(parsed);
    }
  }, [post?.contentIPFS]);

  // Load media from IPFS
  useEffect(() => {
    async function loadMedia() {
      if (parsedContent.mediaHashes.length === 0) return;
      
      setMediaLoading(true);
      const urls: (string | null)[] = [];
      
      for (const hash of parsedContent.mediaHashes) {
        try {
          const url = await fetchIPFSImage(hash);
          urls.push(url);
        } catch (error) {
          console.warn(`Failed to load media for hash ${hash}:`, error);
          urls.push(null);
        }
      }
      
      setMediaUrls(urls);
      setMediaLoading(false);
    }
    
    loadMedia();
    
    // Clean up object URLs on unmount
    return () => {
      mediaUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [parsedContent.mediaHashes]);

  // Fetch author profile to get their profile image using cache
  useEffect(() => {
    async function fetchProfile() {
      if (!post?.author) return;
      
      try {
        const profile = await getCachedProfile(post.author, () => {
          return blockchainService.getUserProfile(post.author);
        });
        
        setAuthorProfile(profile);
        
        // Get image URL from cache or trigger fetch if needed
        if (profile?.profilePhotoIPFS) {
          await requestProfileImage(post.author, profile.profilePhotoIPFS);
          setProfileImageUrl(getCachedProfileImageUrl(post.author));
        }
      } catch (error) {
        console.error("Error fetching author profile:", error);
      }
    }
    
    fetchProfile();
    
    // Set up periodic check for image URL
    const checkImageInterval = setInterval(() => {
      if (post?.author) {
        const cachedImageUrl = getCachedProfileImageUrl(post.author);
        if (cachedImageUrl && cachedImageUrl !== profileImageUrl) {
          setProfileImageUrl(cachedImageUrl);
        }
      }
    }, 500);
    
    return () => clearInterval(checkImageInterval);
  }, [post?.author, profileImageUrl]);

  if (!post) return null;

  function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onLike(post.id, post.isLikedByUser || false);
  }

  function handleProfileClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${post.author}`);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      onDelete &&
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      onDelete(post.id);
    }
  }

  const content = (
    <div className={twJoin("flex flex-col gap-4", !isPage && "cursor-pointer")}>
      <div>
        <div>
          <div className="flex items-center gap-4">
            {profileImageUrl ? (
              <img 
                src={profileImageUrl} 
                alt={`${authorProfile?.username || 'Author'}'s profile`}
                className="rounded-full w-12 h-12 object-cover"
                onError={() => setProfileImageUrl(null)}
              />
            ) : (
              <div className="rounded-full w-12 h-12 bg-theme-splitter flex items-center justify-center">
                <User size={24} className="text-theme-primary" />
              </div>
            )}
            <div>
              <button
                onClick={handleProfileClick}
                className="text-left hover:underline"
              >
                <p>{authorProfile?.username || post.author}</p>
                <p className="text-theme-primary">@{post.author.substring(0, 6)}...{post.author.substring(post.author.length - 4)}</p>
              </button>
            </div>
            {onDelete && !post.isDeleted && (
              <button
                onClick={handleDeleteClick}
                className="ml-auto"
                title="Delete post"
              >
                <Trash2
                  className="text-theme-primary hover:text-red-500 cursor-pointer"
                  size={20}
                />
              </button>
            )}
          </div>
        </div>
      </div>
      <div>
        {/* Post text content */}
        {post.isDeleted ? (
          <span className="italic text-theme-primary">
            This post has been deleted
          </span>
        ) : (
          <p className="mb-3">{parsedContent.text}</p>
        )}
        
        {/* Media grid */}
        {!post.isDeleted && mediaUrls.length > 0 && (
          <div className={`grid ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2 mt-2`}>
            {mediaUrls.map((url, index) => (
              <div 
                key={index} 
                className={`relative rounded-md overflow-hidden ${
                  mediaUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                } ${mediaUrls.length === 1 ? 'max-h-80' : ''}`}
              >
                {mediaLoading ? (
                  <div className="w-full h-full bg-theme-splitter flex items-center justify-center">
                    <Loader className="animate-spin" size={32} />
                  </div>
                ) : url ? (
                  <img 
                    src={url} 
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = document.createElement('div');
                        fallback.className = 'w-full h-full bg-theme-splitter flex items-center justify-center';
                        const icon = document.createElement('div');
                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-theme-primary"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                        fallback.appendChild(icon);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-theme-splitter flex items-center justify-center">
                    <ImageIcon size={32} className="text-theme-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 text-theme-accent">
          <button
            onClick={handleLikeClick}
            className={twJoin(
              "flex items-center justify-center gap-0.5 h-8 rounded-full px-2 pr-3 cursor-pointer",
              post.isLikedByUser
                ? "bg-theme-accent text-theme-text"
                : "bg-theme-primary-muted"
            )}
            disabled={loading || post.isDeleted}
          >
            {loading ? (
              <Loader className="animate-spin" size={20} />
            ) : (
              <ArrowBigUp className="pt-0.5" size={20} />
            )}
            <p>{post.likesCount}</p>
          </button>
          <div className="p-1 px-2 rounded-full bg-theme-primary-muted">
            <p>7$</p>
          </div>
        </div>{" "}
        <p className="text-theme-primary">
          {new Date(post.timestamp * 1000).toLocaleString()}
        </p>
      </div>
    </div>
  );

  return isPage ? content : <Link href={`/post/${post.id}`}>{content}</Link>;
}
