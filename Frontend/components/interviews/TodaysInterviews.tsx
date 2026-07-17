"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Interview } from "@/types/interview";

const API_URL = "http://127.0.0.1:8000";

export default function TodaysInterviews() {
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInterviews();
    }, []);

    const fetchInterviews = async () => {
        try {
            const [interviewsResponse, candidatesResponse] = await Promise.all([
                fetch(`${API_URL}/interviews/`),
                fetch(`${API_URL}/candidates/`),
            ]);

            if (!interviewsResponse.ok || !candidatesResponse.ok) {
                throw new Error("Failed to fetch interviews");
            }

            const [interviewsData, candidatesData] = await Promise.all([
                interviewsResponse.json(),
                candidatesResponse.json(),
            ]);

            const todayDate = new Date();
            const today = [
                todayDate.getFullYear(),
                String(todayDate.getMonth() + 1).padStart(2, "0"),
                String(todayDate.getDate()).padStart(2, "0"),
            ].join("-");

            const todaysData = interviewsData
                .filter((i: Interview) => i.interview_date === today)
                .map((interview: Interview) => ({
                    ...interview,
                    candidate_name:
                        candidatesData.find(
                            (candidate: any) =>
                                Number(candidate.id) === Number(interview.candidate_id)
                        )?.full_name || `Candidate #${interview.candidate_id}`,
                }));

            setInterviews(todaysData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">
                        Today&apos;s Interviews
                    </h2>
                </div>
                <div className="mt-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-16 animate-pulse rounded-2xl bg-slate-800"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-3xl border border-slate-800 bg-[#111827] p-6 shadow-2xl"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                    Today&apos;s Interviews
                </h2>
                <button className="text-sm text-violet-400 hover:text-violet-300 transition">
                    View All
                </button>
            </div>

            <div className="mt-6 space-y-4">
                {interviews.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">
                        No interviews scheduled for today.
                    </p>
                ) : (
                    interviews.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 hover:border-violet-500 transition"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-white">
                                        {item.candidate_name || `Candidate #${item.candidate_id}`}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {item.interview_type}
                                        {item.interview_mode && (
                                            <span className="ml-2 text-slate-500">
                                                · {item.interview_mode}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-sm font-medium text-violet-400">
                                        {item.interview_time}
                                    </p>
                                    <p className={`mt-1 text-xs font-medium ${item.status === "Completed"
                                            ? "text-green-400"
                                            : item.status === "Cancelled"
                                                ? "text-red-400"
                                                : "text-amber-400"
                                        }`}>
                                        {item.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
