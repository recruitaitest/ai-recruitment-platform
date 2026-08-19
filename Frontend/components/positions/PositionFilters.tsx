"use client";

import { Search, SlidersHorizontal } from "lucide-react";

interface Props {
 search: string;
 setSearch: (value: string) => void;
}

export default function PositionFilters({
 search,
 setSearch,
}: Props) {
 return (
 <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
 <div className="relative w-full">
 <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search positions by title, department, location, or skills..."
 className="w-full rounded-2xl border border-border bg-surface py-3 pl-12 pr-4 text-text-primary outline-none placeholder:text-muted"
 />
 </div>
 </div>
 );
}