"use client";

import { useState, useEffect } from "react";
import Comment from "./comment";
import { SendHorizonal, Settings } from "lucide-react";
import blockchainService from "@/lib/blockchain/contracts";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";

interface Comment {
  id: number;
  postId: number;
  author: string;
  content: string;
  timestamp: number;
  likesCount: number;
  isDeleted: boolean;
}

interface CommentContainerProps {
  showCommentInput?: boolean;
  postId?: number;
}

export default function CommentContainer({
  showCommentInput = true,
  postId,
}: CommentContainerProps) {
  const { isConnected } = useBlockchain();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    console.log("isConnected:", isConnected);
    console.log("postId:", postId);
    if (isConnected && postId !== undefined) {
      loadComments();
    }
  }, [isConnected, postId]);

  const loadComments = async () => {
    console.log("Loading comments for post ID:", postId);
    if (postId === undefined) return;

    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
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

    if (postId === undefined) {
      alert("Post ID is required");
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

  return (
    <div className="flex flex-col gap-6">
      {showCommentInput && (
        <div className="flex gap-2 items-end">
          <textarea
            className="bg-theme-primary-muted rounded-lg flex-grow resize-none h-36 p-2"
            name="comment"
            id="comment"
            placeholder="Write a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
          ></textarea>
          <div className="flex flex-col gap-2 bg-theme-secondary-muted p-2 rounded-lg">
            <button className="bg-theme-accent p-1 rounded-full">
              <Settings />
            </button>
            <button
              className="bg-theme-accent p-1 rounded-full"
              onClick={handleAddComment}
              disabled={loadingAction === "add-comment"}
            >
              <SendHorizonal />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : comments.length > 0 ? (
        comments.map((comment) => (
          <Comment
            key={comment.id}
            id={comment.id}
            author={comment.author}
            content={comment.content}
            timestamp={comment.timestamp}
            likesCount={comment.likesCount}
            onLike={handleLikeComment}
          />
        ))
      ) : (
        <p>No comments yet</p>
      )}
    </div>
  );
}
