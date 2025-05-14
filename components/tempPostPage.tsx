"use client";

import React, { useState, useEffect } from "react";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";
import blockchainService from "@/lib/blockchain/contracts";

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  timestamp: number;
  likesCount: number;
  isDeleted: boolean;
}

interface Post {
  id: number;
  author: string;
  contentIPFS: string;
  timestamp: number;
  likesCount: number;
  isDeleted: boolean;
  isLikedByUser?: boolean;
}

interface PostPageProps {
  postId: number;
}

export default function PostPage({ postId }: PostPageProps) {
  const { isConnected, userAddress, connect } = useBlockchain();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      loadPost();
    }
  }, [isConnected, postId]);

  const loadPost = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      // Fetch the post
      const postData = await blockchainService.getPost(postId);

      if (!postData || postData.isDeleted) {
        setPost(null);
        return;
      }

      // Check if user has liked this post
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

      setPost({
        id: postId,
        ...postData,
        isLikedByUser,
      });

      // Load comments
      await loadComments();
    } catch (error) {
      console.error("Error loading post:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentIds = await blockchainService.getPostComments(postId);

      if (!commentIds || commentIds.length === 0) {
        setComments([]);
        return;
      }

      const commentPromises = commentIds.map(async (id: number) => {
        try {
          const comment = await blockchainService.getComment(id);
          return comment ? { id, ...comment } : null;
        } catch (error) {
          console.error(`Error loading comment ${id}:`, error);
          return null;
        }
      });

      const commentResults = await Promise.all(commentPromises);
      setComments(
        commentResults.filter(
          (comment) => comment && !comment.isDeleted
        ) as Comment[]
      );
    } catch (error) {
      console.error("Error loading comments:", error);
    }
  };

  const handleLikePost = async () => {
    if (!isConnected || !post) {
      alert("Please connect to MetaMask first");
      return;
    }

    try {
      setLoadingAction("like-post");

      if (post.isLikedByUser) {
        // Unlike the post
        await blockchainService.unlikePost(post.id);
        setPost({
          ...post,
          likesCount: Math.max(0, post.likesCount - 1),
          isLikedByUser: false,
        });
      } else {
        // Like the post
        await blockchainService.likePost(post.id);
        setPost({
          ...post,
          likesCount: post.likesCount + 1,
          isLikedByUser: true,
        });
      }
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    try {
      setLoadingAction(`like-comment-${commentId}`);
      await blockchainService.likeComment(commentId);

      // Update comment in local state
      setComments(
        comments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, likesCount: comment.likesCount + 1 };
          }
          return comment;
        })
      );
    } catch (error) {
      console.error("Error liking comment:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddComment = async () => {
    if (!isConnected) {
      alert("Please connect to MetaMask first");
      return;
    }

    if (!commentContent.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      setLoadingAction("add-comment");
      const commentId = await blockchainService.createComment(
        postId,
        commentContent
      );

      if (commentId !== null) {
        // Clear input
        setCommentContent("");

        // Get the new comment and add it to state
        const newComment = await blockchainService.getComment(commentId);
        if (newComment) {
          setComments([...comments, { id: commentId, ...newComment }]);
        } else {
          // If we couldn't fetch the new comment, reload all comments
          await loadComments();
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isConnected) {
    return (
      <div>
        <h3>Connect to Your Wallet</h3>
        <button onClick={connect} disabled={loading}>
          {loading ? "Connecting..." : "Connect with MetaMask"}
        </button>
      </div>
    );
  }

  if (loading) {
    return <div>Loading post...</div>;
  }

  if (!post) {
    return <div>Post not found or has been deleted.</div>;
  }

  return (
    <div>
      {/* Post Content */}
      <div>
        <div>
          <span>Post ID: {post.id}</span>
          <span> • By: {post.author}</span>
          <span> • {new Date(post.timestamp * 1000).toLocaleString()}</span>
        </div>

        <div>
          {post.contentIPFS && post.contentIPFS.startsWith("ipfs://") ? (
            <a
              href={post.contentIPFS.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on IPFS
            </a>
          ) : (
            post.contentIPFS || "No content"
          )}
        </div>

        <div>
          <span>
            {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
          </span>
          <button
            onClick={handleLikePost}
            disabled={loadingAction === "like-post"}
          >
            {loadingAction === "like-post"
              ? "Processing..."
              : post.isLikedByUser
              ? "Unlike"
              : "Like"}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div>
        <h4>Comments ({comments.length})</h4>

        {/* Comment List */}
        {comments.length > 0 ? (
          <div>
            {comments.map((comment) => (
              <div key={comment.id}>
                <div>
                  <span>{comment.author}</span>
                  <span>
                    {" "}
                    • {new Date(comment.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
                <p>{comment.content}</p>
                <div>
                  <span>
                    {comment.likesCount}{" "}
                    {comment.likesCount === 1 ? "like" : "likes"}
                  </span>
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={loadingAction === `like-comment-${comment.id}`}
                  >
                    {loadingAction === `like-comment-${comment.id}`
                      ? "Processing..."
                      : "Like"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No comments yet</p>
        )}

        {/* Add Comment Form */}
        <div>
          <textarea
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="Add a comment..."
          />
          <button
            onClick={handleAddComment}
            disabled={loadingAction === "add-comment"}
          >
            {loadingAction === "add-comment" ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
