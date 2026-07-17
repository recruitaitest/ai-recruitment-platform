"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { getTopSkills } from "@/services/analyticsService";


export function SourceAnalytics() {
    const [sourceData, setSourceData] = useState<any[]>([]);
    useEffect(() => {
        loadTopSkills();
    }, []);

    const loadTopSkills = async () => {
        try {
            const data = await getTopSkills();

            const colors = [
                "#3B82F6",
                "#8B5CF6",
                "#D946EF",
                "#EC4899",
                "#14B8A6",
                "#F59E0B",
            ];

            const total = (Object.values(data) as number[]).reduce(
                (sum: number, value: number) => sum + value,
                0
            );
            const formattedData = Object.entries(data as Record<string, number>)
                .slice(0, 6)
                .map(([skill, count], index) => ({
                    source: skill,
                    candidates: Number(count),
                    percentage: total
                        ? `${(
                            (Number(count) / total) *
                            100
                        ).toFixed(1)}%`
                        : "0%",
                    color: colors[index % colors.length],
                }));

            setSourceData(formattedData);

        } catch (error) {
            console.error(error);
        }
    };
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

            {/* Header */}
            <div className="mb-8">

                <h2 className="text-3xl font-bold text-white">
                    Top Skills
                </h2>

                <p className="text-gray-400 mt-2">
                    Candidate acquisition performance by source
                </p>

            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 items-center">

                {/* Chart */}
                <div className="relative h-[360px]">

                    <ResponsiveContainer width="100%" height="100%">

                        <PieChart>

                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={130}
                                paddingAngle={3}
                                dataKey="candidates"
                                stroke="none"
                            >

                                {sourceData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}

                            </Pie>

                        </PieChart>

                    </ResponsiveContainer>

                    {/* Center */}
                    <div
                        className="
              absolute
              inset-0
              flex
              flex-col
              items-center
              justify-center
              pointer-events-none
            "
                    >

                        <h2 className="text-4xl font-bold text-white">
                            {
                                sourceData.reduce(
                                    (sum, item) => sum + item.candidates,
                                    0
                                )
                            }
                        </h2>

                        <p className="text-gray-400 mt-2">
                            Candidates
                        </p>

                    </div>

                </div>

                {/* Right Side Stats */}
                <div className="space-y-3">

                    {sourceData.map((item) => (

                        <div
                            key={item.source}
                            className="
                flex
                items-center
                justify-between
                rounded-2xl
                border
                border-white/10
                bg-white/5
                px-4
                py-3
              "
                        >

                            {/* Left */}
                            <div className="flex items-center gap-3">

                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor: item.color,
                                    }}
                                />

                                <span className="text-white text-sm font-medium">
                                    {item.source}
                                </span>

                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-4">

                                <span className="text-white text-sm font-semibold">
                                    {item.candidates}
                                </span>

                                <span
                                    className="text-sm font-semibold"
                                    style={{
                                        color: item.color,
                                    }}
                                >
                                    {item.percentage}
                                </span>

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}