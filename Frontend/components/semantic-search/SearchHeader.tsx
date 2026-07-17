import { BookmarkPlus, Sparkles } from "lucide-react";

export default function SearchHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Left Section */}
            <div>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-blue-500" />

                    <h1 className="text-3xl font-bold tracking-tight">
                        AI Semantic Search
                    </h1>
                </div>

                <p className="mt-2 text-muted-foreground">
                    Find the best candidates using AI-powered natural language search.
                </p>
            </div>

            {/* Right Section */}
            <button className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                <BookmarkPlus className="h-4 w-4" />
                Save Search
            </button>
        </div>
    );
}