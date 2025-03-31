import Post from "./post-container/post";

export default function PostContainer() {
  return (
    <div className="flex flex-col flex-6 gap-8">
      <Post />
      <Post />
      <Post />
    </div>
  );
}
