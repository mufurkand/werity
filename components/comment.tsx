import { ArrowBigUp, Loader } from "lucide-react";
import { twJoin } from "tailwind-merge";

interface CommentProps {
  id: number;
  author: string;
  content: string;
  timestamp: number;
  likesCount: number;
  isLikedByUser: boolean;
  loading?: boolean;
  onLike?: (commentId: number, alreadyLiked: boolean) => Promise<void>;
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
}: CommentProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <div className="rounded-full bg-theme-splitter w-10 h-10"></div>
        <div>
          <p className="font-bold">
            {author.slice(0, 6)}...{author.slice(-4)}
          </p>
          <p className="text-theme-primary">
            {new Date(timestamp * 1000).toLocaleString()}
          </p>
        </div>
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
