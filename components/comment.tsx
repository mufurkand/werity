import { ArrowBigUp, Loader, Trash2, User } from "lucide-react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import { useState, useEffect } from "react";
import blockchainService from "@/lib/blockchain/contracts";
import { getCachedProfile, getCachedProfileImageUrl, requestProfileImage } from "@/lib/utils/profileCache";

interface CommentProps {
  id: number;
  author: string;
  content: string;
  timestamp: number;
  likesCount: number;
  isLikedByUser: boolean;
  loading?: boolean;
  onLike?: (commentId: number, alreadyLiked: boolean) => Promise<void>;
  onDelete?: (commentId: number) => Promise<void>;
}

export default function Comment({
  id,
  author,
  content,
  timestamp,
  likesCount,
  isLikedByUser,
  loading = false,
  onLike,
  onDelete,
}: CommentProps) {
  const { userAddress } = useBlockchain();
  const isAuthor = userAddress?.toLowerCase() === author?.toLowerCase();
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  // Fetch commenter profile to get their profile image using cache
  useEffect(() => {
    async function fetchProfile() {
      if (!author) return;
      
      try {
        const profile = await getCachedProfile(author, () => {
          return blockchainService.getUserProfile(author);
        });
        
        setAuthorProfile(profile);
        
        // Get image URL from cache or trigger fetch if needed
        if (profile?.profilePhotoIPFS) {
          await requestProfileImage(author, profile.profilePhotoIPFS);
          setProfileImageUrl(getCachedProfileImageUrl(author));
        }
      } catch (error) {
        console.error("Error fetching commenter profile:", error);
      }
    }
    
    fetchProfile();
    
    // Set up periodic check for image URL
    const checkImageInterval = setInterval(() => {
      if (author) {
        const cachedImageUrl = getCachedProfileImageUrl(author);
        if (cachedImageUrl && cachedImageUrl !== profileImageUrl) {
          setProfileImageUrl(cachedImageUrl);
        }
      }
    }, 500);
    
    return () => clearInterval(checkImageInterval);
  }, [author, profileImageUrl]);

  const handleDelete = () => {
    if (onDelete && !loading && isAuthor) {
      if (
        window.confirm(
          "Are you sure you want to delete this comment? This action cannot be undone."
        )
      ) {
        onDelete(id);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center justify-between">
        <div className="flex gap-2 items-center">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt={`${authorProfile?.username || 'Author'}'s profile`}
              className="rounded-full w-10 h-10 object-cover"
              onError={() => setProfileImageUrl(null)}
            />
          ) : (
            <div className="rounded-full bg-theme-splitter w-10 h-10 flex items-center justify-center">
              <User size={20} className="text-theme-primary" />
            </div>
          )}
          <div>
            <Link href={`/profile/${author}`} className="hover:underline">
              <p className="font-bold">
                {authorProfile?.username || `${author.slice(0, 6)}...${author.slice(-4)}`}
              </p>
            </Link>
            <p className="text-theme-primary">
              {new Date(timestamp * 1000).toLocaleString()}
            </p>
          </div>
        </div>
        {isAuthor && onDelete && (
          <button
            onClick={handleDelete}
            className="text-theme-primary hover:text-red-500 cursor-pointer"
            title="Delete comment"
            disabled={loading}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      <p>{content}</p>{" "}
      <div className="flex gap-2 text-theme-accent">
        <button
          onClick={() => onLike && !loading && onLike(id, isLikedByUser)}
          className={twJoin(
            "flex items-center justify-center gap-0.5 h-8 rounded-full px-2 pr-3 cursor-pointer",
            isLikedByUser
              ? "bg-theme-accent text-theme-text"
              : "bg-theme-primary-muted"
          )}
          disabled={loading}
        >
          {loading ? (
            <Loader className="animate-spin" size={20} />
          ) : (
            <ArrowBigUp className="pt-0.5" size={20} />
          )}
          <p>{likesCount}</p>
        </button>
        <div className="p-1 px-2 rounded-full bg-theme-primary-muted">
          <p>7$</p>
        </div>
      </div>
    </div>
  );
}
