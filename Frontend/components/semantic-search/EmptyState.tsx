import { SearchX } from "lucide-react";

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">

            <div className="mb-4 rounded-full bg-muted p-4">
                <SearchX className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="text-xl font-semibold">
                No Candidates Found
            </h3>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Try adjusting your search query or filters to discover more matching candidates.
            </p>
        </div>
    );
}