"use client";

import { useEffect, useState } from "react";

interface Recruiter {
    id?: number;
    name: string;
    candidates: number;
    interviews: number;
    hires: number;
    performance: string;
}

export function RecruiterProductivity() {
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(
            (process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/dashboard/recruiter-productivity"
        )
            .then((res) => {
                if (!res.ok) {
                    throw new Error(
                        "Failed to fetch recruiter data"
                    );
                }
                return res.json();
            })
            .then((data) => {
                setRecruiters(data);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div
                className="
                rounded-[30px]
                border
                border-white/10
                bg-[#07142b]/90
                backdrop-blur-xl
                p-6
                shadow-2xl
            "
            >
                <p className="text-white">
                    Loading recruiter productivity...
                </p>
            </div>
        );
    }

    return (
        <div
            className="
            rounded-[30px]
            border
            border-white/10
            bg-[#07142b]/90
            backdrop-blur-xl
            p-6
            shadow-2xl
        "
        >
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">
                    Recruiter Productivity
                </h2>

                <p className="text-gray-400 mt-2 text-sm">
                    Recruiter hiring performance and activity metrics
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">
                                Recruiter
                            </th>

                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">
                                Candidates
                            </th>

                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">
                                Interviews
                            </th>

                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">
                                Hires
                            </th>

                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">
                                Performance
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {recruiters.length > 0 ? (
                            recruiters.map(
                                (recruiter, index) => (
                                    <tr
                                        key={
                                            recruiter.id ||
                                            index
                                        }
                                        className="
                                        border-b
                                        border-white/5
                                        hover:bg-white/5
                                        transition
                                    "
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="
                                                    w-10
                                                    h-10
                                                    rounded-full
                                                    bg-blue-500/20
                                                    flex
                                                    items-center
                                                    justify-center
                                                    text-blue-400
                                                    font-semibold
                                                "
                                                >
                                                    {recruiter.name?.charAt(
                                                        0
                                                    )}
                                                </div>

                                                <span className="text-white font-medium">
                                                    {
                                                        recruiter.name
                                                    }
                                                </span>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4 text-gray-300">
                                            {
                                                recruiter.candidates
                                            }
                                        </td>

                                        <td className="py-4 px-4 text-gray-300">
                                            {
                                                recruiter.interviews
                                            }
                                        </td>

                                        <td className="py-4 px-4 text-gray-300">
                                            {recruiter.hires}
                                        </td>

                                        <td className="py-4 px-4">
                                            <span
                                                className="
                                                rounded-full
                                                bg-emerald-500/15
                                                px-3
                                                py-1
                                                text-sm
                                                font-semibold
                                                text-emerald-400
                                            "
                                            >
                                                {
                                                    recruiter.performance
                                                }
                                            </span>
                                        </td>
                                    </tr>
                                )
                            )
                        ) : (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="py-8 text-center text-gray-400"
                                >
                                    No recruiter data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}