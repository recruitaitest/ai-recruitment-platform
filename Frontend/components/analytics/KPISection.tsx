"use client";

import {
    Users,
    Briefcase,
    CalendarCheck2,
    UserCheck,
} from "lucide-react";

import { useEffect, useState } from "react";
import { getDashboardAnalytics } from "@/services/analyticsService";

export function KPISection() {

    const [kpiData, setKpiData] = useState<any[]>([]);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            const data = await getDashboardAnalytics();
            console.log(data);

            setKpiData([
                {
                    title: "Total Candidates",
                    value: data.total_candidates,
                    growth: "",
                    icon: "users",
                },
                {
                    title: "Active Jobs",
                    value: data.total_positions,
                    growth: "",
                    icon: "briefcase",
                },
                {
                    title: "Interviews",
                    value: data.total_interviews,
                    growth: "",
                    icon: "calendar",
                },
                {
                    title: "Successful Hires",
                    value: data.total_hired,
                    growth: "",
                    icon: "hires",
                },
            ]);
        } catch (error) {
            console.error("Analytics Summary Error:", error);
        }
    };

    const renderIcon = (icon: string) => {

        switch (icon) {

            case "users":
                return (
                    <Users className="w-6 h-6 text-blue-400" />
                );

            case "briefcase":
                return (
                    <Briefcase className="w-6 h-6 text-blue-400" />
                );

            case "calendar":
                return (
                    <CalendarCheck2 className="w-6 h-6 text-blue-400" />
                );

            case "hires":
                return (
                    <UserCheck className="w-6 h-6 text-blue-400" />
                );

            default:
                return null;

        }

    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

            {kpiData.map((item) => (

                <div
                    key={item.title}
                    className="
            rounded-2xl
            border
            border-white/10
            bg-white/5
            backdrop-blur-md
            p-6
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-1
            hover:shadow-blue-500/10
            hover:shadow-2xl
          "
                >

                    {/* Top Row */}
                    <div className="flex items-center justify-between">

                        <div>

                            <p className="text-sm text-gray-400">
                                {item.title}
                            </p>

                            <h2 className="text-3xl font-bold mt-2">
                                {item.value}
                            </h2>

                        </div>

                        {/* Icon */}
                        <div
                            className="
                p-3
                rounded-2xl
                bg-blue-500/10
                border
                border-blue-500/20
              "
                        >

                            {renderIcon(item.icon)}

                        </div>

                    </div>

                    {/* Bottom */}
                    <div className="mt-5">

                        <span className="text-emerald-400 text-sm font-medium">
                            {item.growth}
                        </span>

                        <span className="text-gray-400 text-sm ml-2">
                            from last month
                        </span>

                    </div>

                </div>

            ))}

        </div>
    );
}