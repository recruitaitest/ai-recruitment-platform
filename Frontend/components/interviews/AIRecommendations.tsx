"use client";

import { useEffect, useState, useMemo } from "react";
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface InterviewData {
    id: number;
    candidate_id: number;
    position_id: number;
    interview_date: string;
    interview_time: string;
    interview_type: string;
    interview_mode?: string;
    status: string;
    feedback?: string;
    overall_rating?: number;
    recommendation?: string;
}

export default function AIRecommendations() {
    const [interviews, setInterviews] = useState<InterviewData[]>([]);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [interviewsRes, candidatesRes, positionsRes] = await Promise.all([
                fetch(`${API_URL}/interviews/`),
                fetch(`${API_URL}/candidates/`),
                fetch(`${API_URL}/positions/`),
            ]);

            const [interviewsData, candidatesData, positionsData] = await Promise.all([
                interviewsRes.json(),
                candidatesRes.json(),
                positionsRes.json(),
            ]);

            setInterviews(interviewsData);
            setCandidates(candidatesData);
            setPositions(positionsData);
        } catch (error) {
            console.error("Failed to fetch AI insights data:", error);
        } finally {
            setLoading(false);
        }
    };

    const insights = useMemo(() => {
        if (interviews.length === 0 && candidates.length === 0) return [];

        const result: { icon: React.ReactNode; text: string; type: "info" | "success" | "warning" | "tip" }[] = [];

        // 1. Completion rate insight
        const completed = interviews.filter((i) => i.status === "Completed");
        const scheduled = interviews.filter((i) => i.status === "Scheduled");
        const total = interviews.length;

        if (total > 0) {
            const completionRate = Math.round((completed.length / total) * 100);
            if (completionRate >= 80) {
                result.push({
                    icon: <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />,
                    text: `Strong completion rate: ${completionRate}% of interviews completed (${completed.length}/${total}).`,
                    type: "success",
                });
            } else if (completionRate < 50 && total > 2) {
                result.push({
                    icon: <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />,
                    text: `Low completion rate: Only ${completionRate}% of interviews completed. Consider following up on ${scheduled.length} pending interviews.`,
                    type: "warning",
                });
            }
        }

        // 2. Upcoming interviews needing attention
        const today = new Date().toISOString().split("T")[0];
        const upcomingToday = interviews.filter(
            (i) => i.interview_date === today && i.status === "Scheduled"
        );
        if (upcomingToday.length > 0) {
            result.push({
                icon: <Clock className="h-4 w-4 text-violet-400 shrink-0" />,
                text: `${upcomingToday.length} interview${upcomingToday.length > 1 ? "s" : ""} scheduled for today. Make sure all panels are prepared.`,
                type: "info",
            });
        }

        // 3. Top-rated candidates from completed interviews
        const highRated = completed
            .filter((i) => i.overall_rating && i.overall_rating >= 4)
            .map((i) => {
                const candidate = candidates.find((c) => Number(c.id) === Number(i.candidate_id));
                return candidate ? candidate.full_name : null;
            })
            .filter(Boolean);

        if (highRated.length > 0) {
            const uniqueNames = [...new Set(highRated)];
            const displayNames = uniqueNames.slice(0, 2).join(", ");
            const moreCount = uniqueNames.length > 2 ? ` and ${uniqueNames.length - 2} more` : "";
            result.push({
                icon: <TrendingUp className="h-4 w-4 text-green-400 shrink-0" />,
                text: `Top performers: ${displayNames}${moreCount} scored 4+ in interviews. Consider fast-tracking their pipeline.`,
                type: "success",
            });
        }

        // 4. Candidates with pending HR Round after Technical
        const technicalPassed = completed.filter(
            (i) =>
                (i.interview_type === "Technical" || i.interview_type === "Technical Interview") &&
                i.recommendation === "Pass"
        );
        const hrScheduled = interviews.filter(
            (i) => i.interview_type === "HR Round" && i.status === "Scheduled"
        );

        const pendingHR = technicalPassed.filter((tech) => {
            const hasHR = hrScheduled.some(
                (hr) =>
                    hr.candidate_id === tech.candidate_id &&
                    hr.position_id === tech.position_id
            );
            return !hasHR;
        });

        if (pendingHR.length > 0) {
            const names = pendingHR
                .map((i) => {
                    const c = candidates.find((c) => Number(c.id) === Number(i.candidate_id));
                    return c?.full_name;
                })
                .filter(Boolean)
                .slice(0, 2);

            if (names.length > 0) {
                result.push({
                    icon: <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />,
                    text: `${names.join(", ")} passed Technical round but ${pendingHR.length > 1 ? "don't" : "doesn't"} have an HR Round scheduled yet.`,
                    type: "warning",
                });
            }
        }

        // 5. Interview type distribution insight
        const technicalCount = interviews.filter(
            (i) => i.interview_type === "Technical" || i.interview_type === "Technical Interview"
        ).length;
        const hrCount = interviews.filter((i) => i.interview_type === "HR Round").length;

        if (total > 3 && technicalCount > 0 && hrCount > 0) {
            const ratio = Math.round((technicalCount / (technicalCount + hrCount)) * 100);
            result.push({
                icon: <TrendingUp className="h-4 w-4 text-blue-400 shrink-0" />,
                text: `Interview mix: ${ratio}% Technical, ${100 - ratio}% HR Round across ${total} total interviews.`,
                type: "tip",
            });
        }

        // 6. Positions with most interviews
        if (total > 0) {
            const positionCounts: Record<number, number> = {};
            interviews.forEach((i) => {
                positionCounts[i.position_id] = (positionCounts[i.position_id] || 0) + 1;
            });
            const topPositionId = Number(
                Object.entries(positionCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
            );
            const topPosition = positions.find((p) => Number(p.id) === topPositionId);
            if (topPosition && positionCounts[topPositionId] > 1) {
                result.push({
                    icon: <Sparkles className="h-4 w-4 text-violet-400 shrink-0" />,
                    text: `Most active role: "${topPosition.title}" has ${positionCounts[topPositionId]} interviews scheduled/completed.`,
                    type: "info",
                });
            }
        }

        // Return max 4 insights
        return result.slice(0, 4);
    }, [interviews, candidates, positions]);

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-slate-900 p-6 shadow-2xl"
        >

            <div className="flex items-center gap-3">

                <div className="rounded-2xl bg-violet-600/20 p-3">
                    <Sparkles className="h-6 w-6 text-violet-400" />
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-white">
                        AI Insights
                    </h2>

                    <p className="text-sm text-slate-400">
                        Smart interview recommendations
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-4">
                {loading ? (
                    <>
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="h-14 animate-pulse rounded-2xl bg-slate-800/60"
                            />
                        ))}
                    </>
                ) : insights.length > 0 ? (
                    insights.map((insight, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`rounded-2xl border p-4 flex items-start gap-3 ${
                                insight.type === "warning"
                                    ? "border-amber-800/40 bg-amber-900/20"
                                    : insight.type === "success"
                                        ? "border-green-800/40 bg-green-900/20"
                                        : "border-slate-800 bg-slate-900/60"
                            }`}
                        >
                            <div className="mt-0.5">{insight.icon}</div>
                            <p className="text-sm text-slate-300">
                                {insight.text}
                            </p>
                        </motion.div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-sm text-slate-500 text-center">
                            No insights available yet. Schedule more interviews to get AI recommendations.
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}