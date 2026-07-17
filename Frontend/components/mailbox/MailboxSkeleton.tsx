"use client";

export default function MailboxSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">

            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="space-y-3">
                    <div className="h-8 w-64 rounded-lg bg-white/10" />

                    <div className="h-4 w-96 rounded-lg bg-white/5" />
                </div>

                <div className="h-12 w-44 rounded-xl bg-blue-500/20" />
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="
            rounded-2xl
            border border-white/10
            bg-white/5
            p-5
            "
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-3">
                                <div className="h-4 w-28 rounded bg-white/10" />

                                <div className="h-10 w-20 rounded bg-white/10" />

                                <div className="h-4 w-40 rounded bg-white/5" />
                            </div>

                            <div className="h-12 w-12 rounded-xl bg-white/10" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div
                className="
        overflow-hidden
        rounded-2xl
        border border-white/10
        bg-white/5
        "
            >
                {/* Header */}
                <div className="border-b border-white/10 px-6 py-5">
                    <div className="h-6 w-52 rounded bg-white/10" />

                    <div className="mt-3 h-4 w-80 rounded bg-white/5" />
                </div>

                {/* Rows */}
                <div className="space-y-4 p-6">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div
                            key={index}
                            className="
                flex items-center justify-between
                rounded-xl
                border border-white/5
                bg-white/[0.02]
                px-4 py-5
            "
                        >
                            <div className="space-y-3">
                                <div className="h-4 w-48 rounded bg-white/10" />

                                <div className="h-3 w-32 rounded bg-white/5" />
                            </div>

                            <div className="h-10 w-24 rounded-lg bg-white/10" />
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}