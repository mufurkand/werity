import { useState, useEffect } from 'react';
import { PostType } from '@/types/posts';
import blockchainService from '@/lib/blockchain/contracts';
import { getCachedProfile, getCachedProfileImageUrl, requestProfileImage } from '@/lib/utils/profileCache';
import { parsePostContent, fetchIPFSImage } from '@/lib/utils/ipfsService';
import { User, Heart, Tag, Sparkles } from 'lucide-react';
import Link from 'next/link';

type DisplayPostProps = {
  post: PostType;
};

export default function DisplayPost({ post }: DisplayPostProps) {
  const [authorProfile, setAuthorProfile] = useState<any>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [parsedContent, setParsedContent] = useState<{ text: string, mediaHashes: string[] }>({ text: '', mediaHashes: [] });
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [originalAuthor, setOriginalAuthor] = useState<string | null>(null);
  const [originalAuthorProfile, setOriginalAuthorProfile] = useState<any>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);

  // Get current user address
  useEffect(() => {
    const userAddress = blockchainService.getUserAddress();
    setCurrentUserAddress(userAddress);
  }, []);

  // Parse post content
  useEffect(() => {
    if (post?.contentIPFS) {
      const parsed = parsePostContent(post.contentIPFS);
      setParsedContent(parsed);
    }
  }, [post?.contentIPFS]);

  // Get original author for NFT posts
  useEffect(() => {
    async function getOriginalAuthor() {
      if (post?.id && post.isNFT) {
        try {
          const originalAuthorAddress = await blockchainService.getOriginalAuthor(post.id);
          if (originalAuthorAddress) {
            setOriginalAuthor(originalAuthorAddress);
            const originalProfile = await blockchainService.getUserProfile(originalAuthorAddress);
            setOriginalAuthorProfile(originalProfile);
          }
        } catch (error) {
          console.error("Error getting original author:", error);
        }
      }
    }
    
    getOriginalAuthor();
  }, [post?.id, post?.isNFT]);

  // Load first media item
  useEffect(() => {
    async function loadFirstMedia() {
      if (parsedContent.mediaHashes.length > 0) {
        try {
          const url = await fetchIPFSImage(parsedContent.mediaHashes[0]);
          setMediaUrl(url);
        } catch (error) {
          console.warn("Failed to load media:", error);
        }
      }
    }
    
    loadFirstMedia();
    
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
    };
  }, [parsedContent.mediaHashes]);

  // Fetch author and owner profiles
  useEffect(() => {
    async function fetchProfiles() {
      const displayAuthor = originalAuthor || post.author;
      if (!displayAuthor) return;
      
      try {
        // Fetch original author profile
        const profile = await getCachedProfile(displayAuthor, () => {
          return blockchainService.getUserProfile(displayAuthor);
        });
        
        setAuthorProfile(profile);
        
        if (profile?.profilePhotoIPFS) {
          await requestProfileImage(displayAuthor, profile.profilePhotoIPFS);
          setProfileImageUrl(getCachedProfileImageUrl(displayAuthor));
        }

        // Fetch current owner profile (for NFT ownership display)
        if (post.isNFT && post.author !== displayAuthor) {
          const currentOwnerProfile = await blockchainService.getUserProfile(post.author);
          setOwnerProfile(currentOwnerProfile);
        }
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    }
    
    fetchProfiles();
  }, [post?.author, originalAuthor, post?.isNFT]);

  const displayAuthor = originalAuthor || post.author;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOwnedByCurrentUser = currentUserAddress && post.author.toLowerCase() === currentUserAddress.toLowerCase();

  return (
    <Link href={`/post/${post.id}`} className="block">
      <div className="relative bg-gradient-to-br from-theme-primary-muted to-theme-secondary-muted p-5 flex flex-col gap-4 rounded-xl min-w-[320px] max-w-md flex-shrink-0 snap-start border border-theme-splitter/30 hover:border-theme-accent/40 transition-all duration-300 overflow-hidden group cursor-pointer">
        {/* Shining animation overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
    
      {/* Author Info */}
      <div className="flex items-center gap-3">
        {profileImageUrl ? (
          <img 
            src={profileImageUrl} 
            alt={`${authorProfile?.username || 'Author'}'s profile`}
            className="rounded-full w-12 h-12 object-cover ring-2 ring-theme-accent/20"
            onError={() => setProfileImageUrl(null)}
          />
        ) : (
          <div className="rounded-full bg-theme-splitter w-12 h-12 flex items-center justify-center ring-2 ring-theme-accent/20">
            <User size={20} className="text-theme-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-theme-text truncate">
            {authorProfile?.username || 'Unknown User'}
          </p>
          <p className="text-theme-primary text-sm">
            @{displayAuthor.substring(0, 6)}...{displayAuthor.substring(displayAuthor.length - 4)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-theme-primary">
            {formatDate(post.timestamp)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {mediaUrl && (
          <div className="float-right ml-3 mb-2">
            <img 
              src={mediaUrl} 
              alt="Post media"
              className="rounded-lg w-20 h-28 object-cover shadow-md"
              onError={() => setMediaUrl(null)}
            />
          </div>
        )}
        {!mediaUrl && parsedContent.mediaHashes.length > 0 && (
          <div className="rounded-lg w-20 h-28 bg-theme-splitter float-right ml-3 mb-2 animate-pulse"></div>
        )}
        <p className="text-sm text-theme-text leading-relaxed line-clamp-4 pr-2">
          {parsedContent.text || "No content available"}
        </p>
      </div>

      {/* Post Stats & Ownership */}
      <div className="flex items-center justify-between pt-2 border-t border-theme-splitter/30">
        <div className="flex items-center gap-4">
          {/* Like Count */}
          <div className="flex items-center gap-1 text-theme-primary">
            <Heart size={14} className="text-red-400" />
            <span className="text-xs font-medium">{post.likesCount}</span>
          </div>
          
          {/* Sparkles for NFT */}
          {post.isNFT && (
            <div className="flex items-center gap-1 text-theme-accent">
              <Sparkles size={14} />
              <span className="text-xs font-medium">Collectible</span>
            </div>
          )}
        </div>

        {/* Ownership Info */}
        <div className="text-right">
          {post.isNFT && isOwnedByCurrentUser && (
            <div className="bg-gradient-to-r from-green-400/20 to-emerald-400/20 px-2 py-1 rounded-full">
              <span className="text-xs font-medium text-green-300">You own this</span>
            </div>
          )}
          {post.isNFT && !isOwnedByCurrentUser && ownerProfile && (
            <div className="bg-theme-accent/20 px-2 py-1 rounded-full">
              <span className="text-xs text-theme-accent">
                Owned by {ownerProfile.username || 'Unknown'}
              </span>
            </div>
          )}
          {post.isNFT && !isOwnedByCurrentUser && !ownerProfile && (
            <div className="bg-theme-accent/20 px-2 py-1 rounded-full">
              <span className="text-xs text-theme-accent">
                Owned by you
              </span>
            </div>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
} 