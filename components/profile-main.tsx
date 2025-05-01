import Wallet from "./profile-main/wallet";

export default function ProfileMain() {
  return (
    <div className="flex justify-around items-center p-8">
      {/* profile */}
      <div>
        <div className="flex">
          <div className="rounded-full h-32 w-32 bg-theme-splitter"></div>
          <div className="flex flex-col justify-center">
            <div>
              <h1 className="text-2xl font-bold">John Doe</h1>
              <p className="text-theme-primary">
                <span className="text-theme-secondary">@</span>johndoe
              </p>
            </div>
            <button className="bg-theme-secondary rounded-md">Follow</button>
          </div>
        </div>
        <p className="text-theme-primary">
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Laboriosam,
          fugit?
        </p>
      </div>
      {/* wallet */}
      <Wallet />
    </div>
  );
}
