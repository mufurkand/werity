import { UserPlus } from "lucide-react";
import Wallet from "./profile-main/wallet";

export default function ProfileMain() {
  return (
    <div className="flex justify-around items-center p-8">
      {/* profile */}
      <div className="flex gap-4 flex-col">
        <div className="flex gap-4">
          <div className="rounded-full h-24 w-24 bg-theme-splitter"></div>
          <div className="flex flex-col justify-center gap-2">
            <div>
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-theme-primary">@johndoe</p>
            </div>
            <button className="bg-theme-secondary rounded-md flex gap-2 items-center justify-center p-1">
              <UserPlus />
              <p>Follow</p>
            </button>
          </div>
        </div>
        <p className="text-theme-primary">
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. In eius cum
          cumque itaque ipsa rerum, temporibus vero consectetur dolorem
          molestiae.
        </p>
      </div>
      {/* wallet */}
      <Wallet />
    </div>
  );
}
