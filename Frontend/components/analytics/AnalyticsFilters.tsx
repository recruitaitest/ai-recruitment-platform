"use client";

import {
    CalendarDays,
    RefreshCw,
} from "lucide-react";

export function AnalyticsFilters() {
    return (
        <div
            className="
        rounded-[24px]
        border
        border-white/10
        bg-[#07142b]/90
        backdrop-blur-xl
        p-5
        shadow-2xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]
      "
        >

            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">

                    {/* Date Filter */}
                    <div
                        className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
            "
                    >

                        <CalendarDays className="w-4 h-4 text-gray-400" />

                        <select
                            className="
                w-full
                bg-transparent
                text-sm
                text-white
                outline-none
              "
                        >
                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Last 7 Days
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Last 30 Days
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Last 3 Months
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Last Year
                            </option>

                        </select>

                    </div>

                    {/* Recruiter Filter */}
                    <div
                        className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
            "
                    >

                        <select
                            className="
                w-full
                bg-transparent
                text-sm
                text-white
                outline-none
              "
                        >

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                All Recruiters
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Sophia Carter
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Daniel Smith
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Emma Wilson
                            </option>

                        </select>

                    </div>

                    {/* Role Filter */}
                    <div
                        className="
              rounded-xl
              border
              border-white/10
              bg-white/5
              px-4
              py-3
            "
                    >

                        <select
                            className="
                w-full
                bg-transparent
                text-sm
                text-white
                outline-none
              "
                        >

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                All Roles
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Frontend Engineer
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                Backend Engineer
                            </option>

                            <option className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                                AI Engineer
                            </option>

                        </select>

                    </div>

                </div>

                {/* Refresh Button */}
                <button
                    className="
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-blue-500
            hover:bg-blue-600
            px-5
            py-3
            text-sm
            font-medium
            text-white
            whitespace-nowrap
            transition-all
            duration-300
          "
                >

                    <RefreshCw className="w-4 h-4" />

                    Refresh Analytics

                </button>

            </div>

        </div>
    );
}