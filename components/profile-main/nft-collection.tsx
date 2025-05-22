import { useState, useEffect } from 'react';
import blockchainService from '@/lib/blockchain/contracts';
import { PostType } from '@/types/posts';
import Post from '../post-container/post';

type NFTCollectionProps = {
  address: string;
};

export default function NFTCollection({ address }: NFTCollectionProps) {
  const [nftPosts, setNftPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);

  useEffect(() => {
    loadNFTPosts();
  }, [address]);

  const loadNFTPosts = async () => {
    try {
      setLoading(true);
      // Get NFT post IDs owned by the user
      const nftPostIds = await blockchainService.getNFTPostsByUser(address);
      
      if (nftPostIds.length === 0) {
        setNftPosts([]);
        return;
      }

      // Load details for each NFT post
      const nftPostDetails = await Promise.all(
        nftPostIds.map(async (postId) => {
          try {
            const post = await blockchainService.getPost(postId);
            if (!post) return null;

            // Check if the user has liked this post
            let isLikedByUser = false;
            const userAddress = blockchainService.getUserAddress();
            if (userAddress) {
              try {
                isLikedByUser = await blockchainService.hasLikedPost(
                  userAddress,
                  postId
                );
              } catch (error) {
                console.error(`Error checking like status for post ${postId}:`, error);
              }
            }

            // Check NFT and listing status
            let isNFT = true; // We know it's an NFT since it's in the NFT collection
            let isListed = false;
            try {
              isListed = await blockchainService.isPostListed(postId);
            } catch (error) {
              console.error(`Error checking listing status for post ${postId}:`, error);
            }

            return {
              id: postId,
              ...post,
              isLikedByUser,
              isNFT,
              isListed
            };
          } catch (error) {
            console.error(`Error loading NFT post ${postId}:`, error);
            return null;
          }
        })
      );

      setNftPosts(nftPostDetails.filter((post) => post !== null) as PostType[]);
    } catch (error) {
      console.error('Error loading NFT posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: number, alreadyLiked: boolean) => {
    try {
      setLoadingPostId(postId);

      if (alreadyLiked) {
        await blockchainService.unlikePost(postId);
        setNftPosts(
          nftPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: Math.max(0, post.likesCount - 1),
                isLikedByUser: false,
              };
            }
            return post;
          })
        );
      } else {
        await blockchainService.likePost(postId);
        setNftPosts(
          nftPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                likesCount: post.likesCount + 1,
                isLikedByUser: true,
              };
            }
            return post;
          })
        );
      }
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Error ${alreadyLiked ? "unliking" : "liking"} post:`,
        error
      );
      alert(
        errorMessage || `Error ${alreadyLiked ? "unliking" : "liking"} post`
      );
    } finally {
      setLoadingPostId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-accent"></div>
      </div>
    );
  }

  if (nftPosts.length === 0) {
    return (
      <div className="flex justify-center items-center p-6 bg-theme-secondary-muted rounded-lg">
        <p className="text-theme-text">No NFT posts in collection</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 flex-6">
      <h2 className="text-xl font-bold">NFT Collection</h2>
      {nftPosts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onLike={handleLikePost}
          loading={loadingPostId === post.id}
        />
      ))}
    </div>
  );
} 