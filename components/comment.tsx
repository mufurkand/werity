import { ArrowBigUp, Loader, Trash2 } from "lucide-react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";
import { useBlockchain } from "@/lib/blockchain/BlockchainContext";

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
          <div className="rounded-full bg-theme-splitter w-10 h-10"></div>
          <div>
            <Link href={`/profile/${author}`} className="hover:underline">
              <p className="font-bold">
                {author.slice(0, 6)}...{author.slice(-4)}
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
            className="text-theme-primary hover:text-red-500"
            title="Delete comment"
            disabled={loading}
          >
            <Trash2 size={18} />
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
