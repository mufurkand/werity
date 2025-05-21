import { PostType } from "@/types/posts";
import { ArrowBigUp, Loader, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { twJoin } from "tailwind-merge";

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

  if (!post) return null;

  function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onLike(post.id, post.isLikedByUser || false);
  }

  function handleProfileClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/profile/${post.author}`);
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (
      onDelete &&
      window.confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      onDelete(post.id);
    }
  }

  const content = (
    <div className={twJoin("flex flex-col gap-4", !isPage && "cursor-pointer")}>
      <div>
        <div>
          <div className="flex items-center gap-4">
            {" "}
            <div className="rounded-full w-12 h-12 bg-theme-splitter"></div>
            <div>
              <button
                onClick={handleProfileClick}
                className="text-left hover:underline"
              >
                <p>{post.author}</p>
                <p className="text-theme-primary">@{post.author}</p>
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
        <p>
          {post.isDeleted ? (
            <span className="italic text-theme-primary">
              This post has been deleted
            </span>
          ) : post.contentIPFS && post.contentIPFS.startsWith("ipfs://") ? (
            // <span>View on IPFS</span>
            <div className="w-full h-24 bg-theme-splitter rounded-md"></div>
          ) : (
            post.contentIPFS || "No content"
          )}
        </p>
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
          <div className="p-1 px-2 rounded-full bg-theme-primary-muted">
            <p>7$</p>
          </div>
        </div>{" "}
        <p className="text-theme-primary">
          {new Date(post.timestamp * 1000).toLocaleString()}
        </p>
      </div>
    </div>
  );

  return isPage ? content : <Link href={`/post/${post.id}`}>{content}</Link>;
}
