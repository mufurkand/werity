"use client";

import { ChevronDown, ChevronUp, User } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { useState, useEffect, useRef } from "react";
import { twJoin } from "tailwind-merge";
import Link from "next/link";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="h-14 px-2 flex gap-2 items-center border-b border-theme-splitter justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="size-8" />
        <div className="border-r border-theme-splitter w-[1px] h-6"></div>
        <p className="ml-2">Home</p>
      </div>
      <div className="relative" ref={menuRef}>
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
            "absolute w-full top-full mt-1 transition-all duration-150 ease-linear transform scale-80 bg-theme-secondary rounded-md px-4 opacity-0 invisible",
            open
              ? "scale-100 py-2 opacity-100 visible"
              : "scale-80 opacity-0 invisible"
          )}
        >
          <Link
            className="flex gap-2 items-center"
            href="/profile"
            onClick={() => setOpen(false)}
          >
            <p>Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
