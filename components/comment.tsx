import { ArrowBigDown, ArrowBigUp, DollarSign } from "lucide-react";

interface CommentProps {
  id: number;
  author: string;
  content: string;
  timestamp: number;
  likesCount: number;
  onLike?: (commentId: number) => Promise<void>;
}

export default function Comment({
  id,
  author,
  content,
  timestamp,
  likesCount,
  onLike,
}: CommentProps) {
  return (
    <div>
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
      <p className="mt-2">{content}</p>
      <div className="flex gap-4 text-theme-accent mt-2">
        <div className="flex items-center gap-0.5 h-8">
          <ArrowBigUp
            onClick={() => onLike && onLike(id)}
            className="rounded-l-full p-1 bg-theme-primary-muted h-full cursor-pointer"
            size={28}
          />
          <div className="p-1 px-2 bg-theme-primary-muted h-full">
            {likesCount}
          </div>
          <ArrowBigDown
            className="rounded-r-full p-1 bg-theme-primary-muted h-full"
            size={28}
          />
        </div>
        <button className="p-1 px-2 rounded-full bg-theme-primary-muted">
          <DollarSign size={20} />
        </button>
      </div>
    </div>
  );
}
