import PostContainer from "@/components/post-container";
import PostControls from "@/components/post-controls";

export default function Home() {
  return (
    <div className="flex p-8 justify-center w-full">
      <div className="flex gap-12 justify-center items-start sm:w-5/6 2xl:w-2/3">
        <PostContainer showAllPosts={true} />
        <PostControls />
      </div>
    </div>
  );
}
