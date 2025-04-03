"use client";

import { ChevronDown, ChevronUp, User } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { useState } from "react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-14 px-2 flex gap-2 items-center border-b border-theme-splitter justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-8" />
        <div className="border-r border-theme-splitter w-[1px] h-6"></div>
        <p className="ml-2">Home</p>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex p-2 px-4 gap-2 bg-theme-secondary transition-all duration-75 rounded-md"
        >
          <User />
          <p>Lorem</p>
          {open ? <ChevronUp /> : <ChevronDown />}
        </button>
        <div
          className={twJoin(
            "absolute w-full top-full mt-1 transition-all duration-300 ease-in-out overflow-hidden max-h-0 bg-theme-secondary rounded-md px-4",
            open ? "max-h-40 py-2" : ""
          )}
        >
          <Link className="flex gap-2 items-center" href="/profile">
            <p>Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
