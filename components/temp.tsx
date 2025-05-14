"use client";

import React, { useState, useEffect } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";
import { useRouter } from "next/navigation";
import { PostType } from "@/types/posts";

type PostProps = {
  post: PostType;
  onLike: (postId: number, alreadyLiked: boolean) => Promise<void>;
  loading: boolean;
};

export function Post({ post, onLike, loading }: PostProps) {
  const router = useRouter();

  function handlePostClick() {
    router.push(`/post/${post.id}`);
  }

  return (
    <div>
      <div onClick={handlePostClick} style={{ cursor: "pointer" }}>
        <div>
          <span>Post ID: {post.id}</span>
          <span>
            By: {post.author.substring(0, 6)}...{post.author.substring(38)}
          </span>
          <span>{new Date(post.timestamp * 1000).toLocaleString()}</span>
        </div>

        <p>
          {post.contentIPFS && post.contentIPFS.startsWith("ipfs://") ? (
            <span>View on IPFS</span>
          ) : (
            post.contentIPFS || "No content"
          )}
        </p>
      </div>

      <div>
        <span>Likes: {post.likesCount}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(post.id, !!post.isLikedByUser);
          }}
          disabled={loading}
        >
          {post.isLikedByUser ? "Unlike" : "Like"}
        </button>
      </div>
    </div>
  );
}

interface UserPostContainerProps {
  showAllPosts?: boolean;
  userId?: string;
}

export const UserPostContainer: React.FC<UserPostContainerProps> = ({
  showAllPosts = false,
  userId,
}) => {
  const { isConnected, userAddress, connect } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const postsPerPage = 20;

  useEffect(() => {
    if (isConnected) {
      if (showAllPosts) {
        loadAllPosts(true);
      } else {
        const targetAddress = userId || userAddress;
        if (targetAddress) {
          loadUserPosts(targetAddress);
        }
      }
    }
  }, [isConnected, userAddress, userId, showAllPosts]);

  const loadUserPosts = async (address: string) => {
    try {
      setLoading(true);
      const postIds = await blockchainService.getUserPosts(address);
      const postDetails = await Promise.all(
        postIds.map(async (id: number) => {
          try {
            const post = await blockchainService.getPost(id);
            if (!post) return null;

            let isLikedByUser = false;
            if (userAddress) {
              try {
                isLikedByUser = await blockchainService.hasLikedPost(
                  userAddress,
                  id
                );
              } catch (error) {
                console.error(
                  `Error checking like status for post ${id}:`,
                  error
                );
              }
            }

            return { id, ...post, isLikedByUser };
          } catch (error) {
            console.error(`Error loading post ${id}:`, error);
            return null;
          }
        })
      );

      setPosts(
        postDetails.filter((post) => post && !post.isDeleted) as PostType[]
      );
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllPosts = async (reset = false) => {
    if (!isConnected) return;

    if (reset) {
      setCurrentPage(1);
      setLoading(true);
      setHasMorePosts(true);
    }

    try {
      const pageToLoad = reset ? 1 : currentPage;

      const postIds = await fetchPostIdsForPage(pageToLoad, postsPerPage);

      if (!postIds || postIds.length === 0) {
        if (reset) {
          setPosts([]);
        }
        setHasMorePosts(false);
        return;
      }

      const postPromises = postIds.map(async (postId: number) => {
        try {
          const post = await blockchainService.getPost(postId);
          if (!post || post.isDeleted) return null;

          let isLikedByUser = false;
          if (userAddress) {
            try {
              isLikedByUser = await blockchainService.hasLikedPost(
                userAddress,
                postId
              );
            } catch (error) {
              console.error(
                `Error checking like status for post ${postId}:`,
                error
              );
            }
          }

          return {
            id: postId,
            ...post,
            isLikedByUser,
          };
        } catch (error) {
          console.error(`Error loading post ${postId}:`, error);
          return null;
        }
      });

      const postResults = await Promise.all(postPromises);
      const validPosts = postResults.filter(
        (post) => post !== null
      ) as PostType[];

      if (reset) {
        setPosts(validPosts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...validPosts]);
      }

      setHasMorePosts(validPosts.length >= postsPerPage);

      if (!reset) {
        setCurrentPage((prevPage) => prevPage + 1);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostIdsForPage = async (
    page: number,
    limit: number
  ): Promise<number[]> => {
    try {
      const offset = (page - 1) * limit;
      const result = await blockchainService.getRecentPosts(offset, limit);
      return result.postIds || [];
    } catch (error) {
      console.error("Error fetching post IDs for page:", error);
      return [];
    }
  };

  const handleLikePost = async (postId: number, alreadyLiked: boolean) => {
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    try {
      setLoadingPostId(postId);

      if (alreadyLiked) {
        await blockchainService.unlikePost(postId);
        setPosts(
          posts.map((post) => {
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
        setPosts(
          posts.map((post) => {
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

  const loadMorePosts = () => {
    if (showAllPosts && !loading && hasMorePosts) {
      loadAllPosts(false);
    }
  };

  if (!isConnected) {
    return (
      <div>
        <button onClick={connect}>Connect with MetaMask</button>
      </div>
    );
  }

  return (
    <div>
      <div>
        <h3>{showAllPosts ? "All Posts" : "User Posts"}</h3>

        {showAllPosts && (
          <button onClick={() => loadAllPosts(true)} disabled={loading}>
            {loading ? "Loading..." : "Refresh Posts"}
          </button>
        )}

        {loading && posts.length === 0 ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>{showAllPosts ? "No posts found." : "No posts yet."}</p>
        ) : (
          <div>
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onLike={handleLikePost}
                loading={loadingPostId === post.id}
              />
            ))}

            {showAllPosts && hasMorePosts && (
              <button onClick={loadMorePosts} disabled={loading}>
                Load More Posts
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPostContainer;
