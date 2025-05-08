import { ArrowBigDown, ArrowBigUp, DollarSign } from "lucide-react";

export default function Comment() {
  return (
    <div>
      <div className="flex gap-2 items-center">
        <div className="rounded-full bg-theme-splitter w-10 h-10"></div>
        <div>
          <p className="font-bold">Jane Doe</p>
          <p className="text-theme-primary">@janedoe</p>
        </div>
      </div>
      <p className="mt-2">
        This is a comment text. Lorem ipsum dolor sit amet.
      </p>
      <div className="flex gap-4 text-theme-accent mt-2">
        <div className="flex items-center gap-0.5 h-8">
          <ArrowBigUp
            className="rounded-l-full p-1 bg-theme-primary-muted h-full"
            size={28}
          />
          <div className="p-1 px-2 bg-theme-primary-muted h-full">5</div>
          <ArrowBigDown
            className="rounded-r-full p-1 bg-theme-primary-muted h-full"
            size={28}
          />
        </div>
        <button className="p-1 px-2 rounded-full bg-theme-primary-muted">
          <DollarSign size={20} />
        </button>
      </div>
    </div>
  );
}
