import Post from "@/components/post-container/post";
import PostControls from "@/components/post-controls";
import { SendHorizonal, Settings } from "lucide-react";
import CommentContainer from "@/components/comment-container";

export default function PostPage() {
  return (
    <div className="flex p-8 justify-center w-full">
      <div className="flex gap-12 justify-center items-start sm:w-5/6 2xl:w-2/3">
        <div className="flex flex-col w-full gap-4 flex-6">
          <Post isPage={true} />
          <div className="flex gap-2 items-end">
            <textarea
              className="bg-theme-primary-muted rounded-lg flex-grow resize-none h-36 p-2"
              name="comment"
              id="comment"
              placeholder="Write a comment..."
            ></textarea>
            <div className="flex flex-col gap-2 bg-theme-secondary-muted p-2 rounded-lg">
              <button className="bg-theme-accent p-1 rounded-full">
                <Settings />
              </button>
              <button className="bg-theme-accent p-1 rounded-full">
                <SendHorizonal />
              </button>
            </div>
          </div>
          <CommentContainer />
        </div>
        <PostControls />
      </div>
    </div>
  );
}
