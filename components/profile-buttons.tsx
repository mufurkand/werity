"use client";

import { useState } from "react";
import { twJoin } from "tailwind-merge";

export default function ProfileButtons() {
  const [selected, setSelected] = useState<"posts" | "comments">("posts");
  const selectedStyle = "bg-theme-primary text-black";
  const unselectedStyle = "";
  const generalStyle = "p-2 rounded-md outline outline-theme-primary";
  return (
    <div className="flex gap-2">
      <button
        className={twJoin(
          generalStyle,
          selected === "posts" ? selectedStyle : unselectedStyle
        )}
        onClick={() => setSelected("posts")}
      >
        Posts
      </button>
      <button
        className={twJoin(
          generalStyle,
          selected === "comments" ? selectedStyle : unselectedStyle
        )}
        onClick={() => setSelected("comments")}
      >
        Comments
      </button>
    </div>
  );
}
