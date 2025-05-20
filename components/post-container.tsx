"use client";

import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import Post from "./post-container/post";
import { useEffect, useState } from "react";
import { PostType } from "@/types/posts";
import blockchainService from "@/lib/blockchain/contracts";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type PostContainerProps = {
  showAllPosts?: boolean;
  userId?: string;
  postId?: number;
};

export default function PostContainer({
  showAllPosts = false,
  userId,
  postId,
}: PostContainerProps) {
  const { isConnected, userAddress } = useBlockchain();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingPostId, setLoadingPostId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const postsPerPage = 20;

  useEffect(() => {
    if (isConnected) {
      if (postId) {
        console.warn("Loading single post");
        loadSinglePost(postId);
      } else if (showAllPosts) {
        console.warn("Loading all posts");
        loadAllPosts(true);
      } else {
        const targetAddress = userId || userAddress;
        console.warn("Loading user posts:", targetAddress, " userId:", userId);
        if (targetAddress) {
          loadUserPosts(targetAddress);
        }
      }
    }
  }, [isConnected, userAddress, userId, showAllPosts, postId]);

  const loadSinglePost = async (id: number) => {
    try {
      setLoading(true);
      const post = await blockchainService.getPost(id);

      if (!post) {
        setPosts([]);
        return;
      }

      let isLikedByUser = false;
      if (userAddress) {
        try {
          isLikedByUser = await blockchainService.hasLikedPost(userAddress, id);
        } catch (error) {
          console.error(`Error checking like status for post ${id}:`, error);
        }
      }

      const postWithDetails = {
        id,
        ...post,
        isLikedByUser,
      };

      setPosts([postWithDetails]);
    } catch (error) {
      console.error(`Error loading post ${id}:`, error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

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
      console.log("Fetched user posts:", postDetails);
      setPosts(postDetails.filter((post) => post) as PostType[]);
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
          if (!post) return null;

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

      console.log("Fetched posts:", validPosts);

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
      alert("Please login or register first");
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

  const handleDeletePost = async (postId: number) => {
    if (!isConnected) {
      alert("Please login or register first");
      return;
    }

    try {
      setLoadingPostId(postId);

      const success = await blockchainService.deletePost(postId);

      if (success) {
        // Remove the post from the UI
        setPosts(posts.filter((post) => post.id !== postId));
      } else {
        alert("Failed to delete the post. Please try again.");
      }
    } catch (error: Error | unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error deleting post:", error);
      alert(errorMessage || "Error deleting post");
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
      <div className="flex-6 p-4 flex justify-center items-center">
        <Link
          href="/auth"
          className="bg-theme-secondary p-2 rounded-lg flex gap-2 items-center"
        >
          <p>Login/Register first to view posts</p>
          <ExternalLink size={20} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-6 gap-8">
      {posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={handleLikePost}
              loading={loadingPostId === post.id}
              onDelete={
                post.author === userAddress ? handleDeletePost : undefined
              }
            />
          ))}

          {showAllPosts && hasMorePosts && (
            <button
              onClick={loadMorePosts}
              disabled={loading}
              className="bg-theme-secondary p-2 rounded-lg text-center"
            >
              Load More Posts
            </button>
          )}
        </>
      ) : (
        <div className="flex justify-center items-center p-6 bg-theme-secondary-muted rounded-lg">
          <p className="text-theme-text">No posts to display</p>
        </div>
      )}
    </div>
  );
}
