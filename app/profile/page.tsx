import Post from "@/components/post";
import ProfileMain from "@/components/profile-main";

export default function Profile() {
  return (
    <div className="w-full flex flex-col">
      <ProfileMain />
      <div className="bg-theme-secondary-muted w-full p-4 flex flex-col gap-4">
        <div className="flex gap-2">
          <p className="text-2xl font-semibold">Furkan&apos;s</p>
          <p className="text-theme-primary text-2xl font-semibold">Display</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x max-w-full">
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
          <Post />
        </div>
      </div>
      <div></div>
    </div>
  );
}
