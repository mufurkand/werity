import { SidebarTrigger } from "./ui/sidebar";

export default function Navbar() {
  return (
    <div className="h-10 px-2 flex gap-2 items-center border-b dark:border-dark-splitter border-light-splitter ">
      <SidebarTrigger className="size-8" />
      <div className="border-r dark:border-dark-splitter border-light-splitter w-[1px] h-6"></div>
      <p className="ml-2">Home</p>
    </div>
  );
}
