import { PostType } from "@/types/posts";
import { ArrowBigUp, Loader, Trash2, User, Image as ImageIcon, FileVideo, Tag, DollarSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { twJoin } from "tailwind-merge";
import { useState, useEffect } from "react";
import blockchainService from "@/lib/blockchain/contracts";
import { getCachedProfile, getCachedProfileImageUrl, requestProfileImage } from "@/lib/utils/profileCache";
import { parsePostContent, fetchIPFSImage } from "@/lib/utils/ipfsService";
import { ethers } from "ethers";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InputDialog } from "@/components/ui/input-dialog";

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
  const [isNFT, setIsNFT] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [listingDetails, setListingDetails] = useState<any>(null);
  const [listingPrice, setListingPrice] = useState("");
  const [isListingLoading, setIsListingLoading] = useState(false);
  const [isBuyingLoading, setIsBuyingLoading] = useState(false);
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0");
  const [originalAuthor, setOriginalAuthor] = useState<string | null>(null);
  const [originalAuthorProfile, setOriginalAuthorProfile] = useState<any>(null);
  
  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showListingDialog, setShowListingDialog] = useState(false);
  const [showCancelListingDialog, setShowCancelListingDialog] = useState(false);
  const [showBuyDialog, setShowBuyDialog] = useState(false);

  // Parse post content to extract text and media references
  useEffect(() => {
    if (post?.contentIPFS) {
      const parsed = parsePostContent(post.contentIPFS);
      setParsedContent(parsed);
    }
  }, [post?.contentIPFS]);

  // Check if post is NFT and if it's listed for sale
  useEffect(() => {
    async function checkNFTStatus() {
      if (!post?.id) return;
      
      try {
        // Check if post is NFT
        const nftStatus = await blockchainService.isPostNFT(post.id);
        setIsNFT(nftStatus);
        
        // Check if post is listed for sale
        const listedStatus = await blockchainService.isPostListed(post.id);
        setIsListed(listedStatus);
        
        // If listed, get listing details
        if (listedStatus) {
          const details = await blockchainService.getListingDetails(post.id);
          setListingDetails(details);
        }

        // If it's an NFT, get the original author and owner info
        if (nftStatus) {
          // Get original author for NFTs
          const originalAuthorAddress = await blockchainService.getOriginalAuthor(post.id);
          if (originalAuthorAddress) {
            setOriginalAuthor(originalAuthorAddress);
            // Get original author's profile
            const originalProfile = await blockchainService.getUserProfile(originalAuthorAddress);
            setOriginalAuthorProfile(originalProfile);
          }
          
          // If not listed, get the current owner's username (for display in owner badge)
          if (!listedStatus) {
            const ownerProfile = await blockchainService.getUserProfile(post.author);
            if (ownerProfile) {
              setOwnerUsername(ownerProfile.username);
            }
          }
        }
      } catch (error) {
        console.error("Error checking NFT status:", error);
        toast.error("Failed to check NFT status");
      }
    }
    
    checkNFTStatus();
  }, [post?.id, post?.author]);

  // Load user's token balance
  useEffect(() => {
    async function loadUserBalance() {
      const userAddress = blockchainService.getUserAddress();
      if (userAddress) {
        try {
          const balance = await blockchainService.getBalance(userAddress);
          setUserBalance(balance);
        } catch (error) {
          console.error("Error loading user balance:", error);
        }
      }
    }
    
    loadUserBalance();
  }, []);

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
          toast.error(`Failed to load media`);
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
      
      // Determine which author to show (original for NFTs, regular for non-NFTs)
      const displayAuthor = originalAuthor || post.author;
      const displayProfile = originalAuthorProfile || authorProfile;
      
      try {
        const profile = await getCachedProfile(displayAuthor, () => {
          return blockchainService.getUserProfile(displayAuthor);
        });
        
        setAuthorProfile(profile);
        
        // Get image URL from cache or trigger fetch if needed
        if (profile?.profilePhotoIPFS) {
          await requestProfileImage(displayAuthor, profile.profilePhotoIPFS);
          setProfileImageUrl(getCachedProfileImageUrl(displayAuthor));
        }
      } catch (error) {
        console.error("Error fetching author profile:", error);
        toast.error("Failed to fetch author profile");
      }
    }
    
    fetchProfile();
    
    // Set up periodic check for image URL
    const checkImageInterval = setInterval(() => {
      const displayAuthor = originalAuthor || post?.author;
      if (displayAuthor) {
        const cachedImageUrl = getCachedProfileImageUrl(displayAuthor);
        if (cachedImageUrl && cachedImageUrl !== profileImageUrl) {
          setProfileImageUrl(cachedImageUrl);
        }
      }
    }, 500);
    
    return () => clearInterval(checkImageInterval);
  }, [post?.author, originalAuthor, originalAuthorProfile, profileImageUrl]);

  if (!post) return null;

  function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onLike(post.id, post.isLikedByUser || false);
  }

  function handleProfileClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const displayAuthor = originalAuthor || post.author;
    router.push(`/profile/${displayAuthor}`);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  }

  function handleConfirmDelete() {
    if (onDelete) {
      onDelete(post.id);
      toast.success("Post deleted successfully");
    }
  }

  async function handleListForSale(price: string) {
    if (!price || parseFloat(price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    
    setIsListingLoading(true);
    try {
      toast.loading("Listing post for sale...");
      const success = await blockchainService.listPostForSale(post.id, price);
      if (success) {
        setIsListed(true);
        // Refresh listing details
        const details = await blockchainService.getListingDetails(post.id);
        setListingDetails(details);
        toast.dismiss();
        toast.success("Post listed for sale successfully");
      } else {
        toast.dismiss();
        toast.error("Failed to list post for sale");
      }
    } catch (error) {
      console.error("Error listing post for sale:", error);
      toast.dismiss();
      toast.error("Error listing post for sale");
    } finally {
      setIsListingLoading(false);
    }
  }

  async function handleCancelListing() {
    setIsListingLoading(true);
    try {
      toast.loading("Cancelling listing...");
      const success = await blockchainService.cancelListing(post.id);
      if (success) {
        setIsListed(false);
        setListingDetails(null);
        toast.dismiss();
        toast.success("Listing cancelled successfully");
      } else {
        toast.dismiss();
        toast.error("Failed to cancel listing");
      }
    } catch (error) {
      console.error("Error canceling listing:", error);
      toast.dismiss();
      toast.error("Error canceling listing");
    } finally {
      setIsListingLoading(false);
    }
  }

  async function handleBuyPost() {
    setIsBuyingLoading(true);
    try {
      toast.loading("Processing purchase...");
      await blockchainService.buyPost(post.id);
      toast.dismiss();
      toast.success("Successfully purchased post!");
      // Refresh the page to show updated ownership
      window.location.reload();
    } catch (error: any) {
      console.error("Error buying post:", error);
      toast.dismiss();
      
      // Show specific error messages
      if (error.message?.includes("Insufficient token balance")) {
        toast.error("You don't have enough tokens to buy this post");
      } else if (error.message?.includes("Post is not listed for sale")) {
        toast.error("This post is no longer available for sale");
      } else if (error.message?.includes("Cannot buy your own post")) {
        toast.error("You cannot buy your own post");
      } else if (error.message?.includes("User rejected the request")) {
        toast.error("Transaction was cancelled");
      } else {
        toast.error("Failed to buy post. Please try again.");
      }
    } finally {
      setIsBuyingLoading(false);
    }
  }

  const content = (
    <div className={twJoin("flex flex-col gap-4", !isPage ? "cursor-pointer" : "")}>
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
                <p>{authorProfile?.username || (originalAuthor || post.author)}</p>
                <p className="text-theme-primary">@{(originalAuthor || post.author).substring(0, 6)}...{(originalAuthor || post.author).substring((originalAuthor || post.author).length - 4)}</p>
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
          
          {/* NFT Badge and Price/Owner Badge */}
          {isNFT && (
            <div className="flex items-center gap-1">
              <div className="p-1 px-2 rounded-full bg-theme-secondary flex items-center gap-1">
                <Tag size={14} className="text-theme-accent" />
                <span className="text-sm">NFT</span>
              </div>
            </div>
          )}
          
          {isListed && listingDetails && (
            <div 
              className="p-1 px-2 rounded-full bg-theme-accent text-white flex items-center gap-1 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isPage) {
                  setShowBuyDialog(true);
                } else {
                  router.push(`/post/${post.id}`);
                }
              }}
              title={`Listed for ${ethers.formatEther(listingDetails.price)} tokens`}
            >
              <DollarSign size={14} />
              <span className="text-sm">{ethers.formatEther(listingDetails.price)} SOCIAL</span>
            </div>
          )}
          
          {isNFT && !isListed && ownerUsername && originalAuthor && post.author.toLowerCase() !== originalAuthor.toLowerCase() && (
            <div className="p-1 px-2 rounded-full bg-theme-secondary flex items-center gap-1" title={`Current owner: ${ownerUsername}`}>
              <User size={14} className="text-theme-accent" />
              <span className="text-sm">Owned by {ownerUsername}</span>
            </div>
          )}
        </div>
        <p className="text-theme-primary">
          {new Date(post.timestamp * 1000).toLocaleString()}
        </p>
      </div>

      {/* NFT and Listing UI - Only show on post page */}
      {!post.isDeleted && isPage && (
        <div className="flex flex-col gap-2 mt-2">
          {/* Listing Status */}
          {isListed && listingDetails && (
            <div className="border border-theme-accent rounded-md p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-theme-accent" />
                  <span>Listed for sale: {ethers.formatEther(listingDetails.price)} tokens</span>
                </div>
                
                {/* If current user is the seller, show cancel button */}
                {blockchainService.getUserAddress()?.toLowerCase() === listingDetails.seller?.toLowerCase() ? (
                  <button
                    onClick={() => setShowCancelListingDialog(true)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                    disabled={isListingLoading}
                  >
                    {isListingLoading ? <Loader className="animate-spin" size={16} /> : "Cancel Listing"}
                  </button>
                ) : (
                  /* Otherwise show buy button */
                  <button
                    onClick={() => setShowBuyDialog(true)}
                    className="bg-theme-accent text-white px-3 py-1 rounded-md hover:bg-theme-accent-hover"
                    disabled={isBuyingLoading}
                  >
                    {isBuyingLoading ? <Loader className="animate-spin" size={16} /> : "Buy Now"}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* List for Sale Button (only shown to post owner if not already listed) */}
          {!isListed && 
           blockchainService.getUserAddress()?.toLowerCase() === post.author?.toLowerCase() && (
            <button
              onClick={() => setShowListingDialog(true)}
              className="bg-theme-secondary text-theme-text px-3 py-2 rounded-md hover:bg-theme-secondary-hover"
            >
              List for Sale
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        destructive={true}
      />

      {/* List For Sale Dialog */}
      <InputDialog
        open={showListingDialog}
        onOpenChange={setShowListingDialog}
        title="List Post for Sale"
        description="Enter the price in tokens to list this post for sale."
        label="Price (in tokens)"
        type="number"
        min="0.01"
        step="0.01"
        defaultValue={listingPrice}
        placeholder="Enter price"
        confirmText="List for Sale"
        onConfirm={handleListForSale}
      />

      {/* Cancel Listing Dialog */}
      <ConfirmDialog
        open={showCancelListingDialog}
        onOpenChange={setShowCancelListingDialog}
        title="Cancel Listing"
        description="Are you sure you want to cancel this listing?"
        confirmText="Cancel Listing"
        cancelText="Keep Listed"
        onConfirm={handleCancelListing}
      />

      {/* Buy Post Dialog */}
      <ConfirmDialog
        open={showBuyDialog}
        onOpenChange={setShowBuyDialog}
        title="Buy Post"
        description={
          listingDetails ? 
          `Purchase this post for ${ethers.formatEther(listingDetails.price)} SOCIAL tokens?\n\nYour balance: ${parseFloat(userBalance).toFixed(2)} SOCIAL\n\nThis will mint the post as an NFT and transfer ownership to you.` :
          "Loading post details..."
        }
        confirmText="Buy Now"
        cancelText="Cancel"
        onConfirm={handleBuyPost}
      />
    </div>
  );

  return isPage ? content : <Link href={`/post/${post.id}`}>{content}</Link>;
}
