"use client";

export default function AIInsights() {
    return (
        <div className="flex-1 space-y-4 overflow-y-auto p-5">

            {/* Match Score */}
            <div className="rounded-2xl border bg-background p-4">
                <h3 className="mb-2 text-sm font-semibold">
                    Match Score
                </h3>

                <div className="text-3xl font-bold text-primary">
                    92%
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                    Strong match for Senior Frontend Engineer role.
                </p>
            </div>

            {/* Top Skills */}
            <div className="rounded-2xl border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold">
                    Top Skills
                </h3>

                <div className="flex flex-wrap gap-2">

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        React
                    </span>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Next.js
                    </span>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        TypeScript
                    </span>

                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Tailwind CSS
                    </span>

                </div>
            </div>

            {/* AI Recommendation */}
            <div className="rounded-2xl border bg-background p-4">
                <h3 className="mb-2 text-sm font-semibold">
                    AI Recommendation
                </h3>

                <p className="text-sm leading-6 text-muted-foreground">
                    Candidate demonstrates strong frontend expertise with modern
                    React ecosystem experience and scalable application development skills.
                </p>
            </div>

            {/* Missing Skills */}
            <div className="rounded-2xl border bg-background p-4">
                <h3 className="mb-2 text-sm font-semibold">
                    Missing Skills
                </h3>

                <div className="flex flex-wrap gap-2">

                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                        Docker
                    </span>

                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                        AWS
                    </span>

                </div>
            </div>

        </div>
    );
}