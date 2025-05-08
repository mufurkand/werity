import Comment from "./comment";

export default function CommentContainer() {
  return (
    <div className="flex flex-col gap-6">
      <Comment />
      <Comment />
      <Comment />
    </div>
  );
}
