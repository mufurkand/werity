import Comment from "./comment";

export default function CommentContainer() {
  return (
    <div className="flex flex-col gap-4">
      <Comment />
      <Comment />
      <Comment />
    </div>
  );
}
