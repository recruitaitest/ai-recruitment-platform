import { Sparkles } from "lucide-react";

export default function SearchHeader() {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* Left Section */}
            <div>
                <div className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-ai-accent" />

                    <h1 className="text-3xl font-bold tracking-tight">
                        AI Semantic Search
                    </h1>
                </div>

                <p className="mt-2 text-muted-foreground">
                    Find the best candidates using AI-powered natural language search.
                </p>
            </div>
        </div>
    );
}