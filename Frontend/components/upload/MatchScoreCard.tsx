interface MatchScoreCardProps {
    candidate?: any;
}

export default function MatchScoreCard({
    candidate,
}: MatchScoreCardProps) {
    return (
        <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-[#0c1229] to-[#161b35] p-6 text-center shadow-xl">

            {/* Header */}
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">
                Match Score
            </p>

            {/* Score */}
            <div className="text-6xl font-bold text-indigo-400">
                95%
            </div>

            {/* Status */}
            <p className="mt-3 text-sm text-emerald-400">
                Strong Match
            </p>

            {/* Progress */}
            <div className="mt-6 h-2 w-full rounded-full bg-slate-800 overflow-hidden">

                <div className="h-full w-[95%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />

            </div>

            {/* Footer */}
            <div className="mt-4 flex items-center justify-center gap-2">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                <p className="text-xs text-slate-400">
                    AI relevance evaluation completed
                </p>

            </div>
        </div>
    );
}