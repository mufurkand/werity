"use client";

import { ChevronDown } from "lucide-react";
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
    <div>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={twJoin(
          "flex justify-center bg-theme-secondary-muted p-2 gap-2 items-center w-full transition-all",
          rounded === "top"
            ? "rounded-t-lg"
            : open
            ? ""
            : "rounded-b-lg delay-300 duration-500"
        )}
      >
        {text} <ChevronDown />
      </button>
      <div
        className={twJoin(
          "transition-all duration-300 ease-in-out overflow-hidden max-h-0 bg-theme-secondary-muted px-8",
          open ? "max-h-40 py-8 mt-0.5" : "",
          rounded === "top" ? "" : "rounded-b-lg"
        )}
      >
        Test
      </div>
    </div>
  );
}
