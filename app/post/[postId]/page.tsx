"use client";

import PostControls from "@/components/post-controls";
import { useParams } from "next/navigation";
import CommentContainer from "@/components/comment-container";
import PostContainer from "@/components/post-container";

export default function PostPage() {
  const { postId } = useParams();
  const postIdNumber =
    typeof postId === "string" ? parseInt(postId, 10) : undefined;

  return (
    <div className="flex p-8 justify-center w-full">
      <div className="flex gap-12 justify-center items-start sm:w-5/6 2xl:w-2/3">
        <div className="flex flex-col w-full gap-4 flex-6">
          <PostContainer postId={postIdNumber} />
          <CommentContainer postId={postIdNumber} />
        </div>
        <PostControls />
      </div>
    </div>
  );
}
