import { ChevronDown } from "lucide-react";
interface ScoreBreakdown {
    ai_score?: number;
    skills?: number;
    experience?: number;
}

interface MatchScoreBadgeProps {
    score: number;
    breakdown?: ScoreBreakdown;
    showBreakdown?: boolean;
}

export default function MatchScoreBadge({
    score,
    breakdown,
    showBreakdown = false,
}: MatchScoreBadgeProps) {

    const getScoreColor = () => {
        if (score > 60) return "bg-green-500/15 text-green-400 border border-green-500/30";
        if (score > 50) return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30";
        return "bg-red-500/15 text-red-400 border border-red-500/30";
    };

    const getBarColor = () => {
        if (score > 80) return "bg-green-400";
        if (score > 60) return "bg-yellow-400";
        return "bg-red-400";
    };

    const rows = [
        { label: "AI Match Score", value: breakdown?.ai_score ?? 0, max: 40 },
        { label: "Skills Match", value: breakdown?.skills ?? 0, max: 40 },
        { label: "Experience Match", value: breakdown?.experience ?? 0, max: 20 },
    ];

    return (
        <div className="flex flex-col items-end gap-3 min-w-[160px]">

            {/* Badge */}
            <div className="group relative">

                <div
                    className={`flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ${getScoreColor()}`}
                >
                    {score > 0 ? `${score}% Match` : "Not Ranked"}

                    {showBreakdown && breakdown && (
                        <ChevronDown className="h-3 w-3 opacity-70" />
                    )}
                </div>

                {showBreakdown && breakdown && score > 0 && (
                    <div
                        className="
                invisible absolute right-0 top-10 z-50
                w-72 rounded-xl border border-white/10
                bg-slate-900 p-4 shadow-2xl
                opacity-0 transition-all duration-200
                group-hover:visible
                group-hover:opacity-100
            "
                    >
                        <p className="mb-3 text-xs font-semibold text-white/60">
                            Match Breakdown
                        </p>

                        <div className="space-y-2 text-sm">

                            <div className="flex justify-between">
                                <span>AI Match Score</span>
                                <span>{breakdown.ai_score}/40</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Skills Match</span>
                                <span>{breakdown.skills}/40</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Experience Match</span>
                                <span>{breakdown.experience}/20</span>
                            </div>

                            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{score}/100</span>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}