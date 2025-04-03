"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { twJoin } from "tailwind-merge";
import { useState } from "react";

export function FilterButton({
  text,
  rounded,
}: {
  text: string;
  rounded: "top" | "bottom";
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={twJoin(
          "flex justify-center bg-theme-secondary-muted p-2 gap-2 items-center w-full",
          rounded === "top" ? "rounded-t-md" : "rounded-b-md"
        )}
      >
        <p>{text}</p>
        {open ? <ChevronUp /> : <ChevronDown />}
      </button>
    </div>
  );
}
