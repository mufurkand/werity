import { Filter, Search } from "lucide-react";
import { FilterButton } from "./post-controls/filter-button";

export default function PostControls() {
  return (
    <div className="hidden flex-2 lg:flex flex-col gap-4">
      <div className="bg-theme-secondary-muted p-2 rounded-lg flex gap-2 items-center w-full">
        <Search />
        <input
          type="text"
          className="rounded-lg p-2 w-full bg-theme-primary-muted"
          placeholder="Search"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex gap-2 items-center">
          <p>Filters</p>
          <Filter size={20} />
        </div>
        <FilterButton text="All" rounded="top" />
        <FilterButton text="Following" rounded="bottom" />
      </div>
    </div>
  );
}
