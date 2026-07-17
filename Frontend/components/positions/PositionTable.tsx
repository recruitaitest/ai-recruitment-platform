"use client";

import { Position } from "@/types/positon";

interface Props {
    positions: Position[];
    onSelect: (position: Position) => void;
}

export default function PositionTable({
    positions,
    onSelect,
}: Props) {
    return (
        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl">

            <table className="w-full min-w-[1200px]">

                <thead>
                    <tr className="border-b border-slate-800 text-left text-sm text-slate-400">

                        <th className="px-6 py-5 font-medium">
                            Position
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Department
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Location
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Experience
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Applicants
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Recruiter
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Status
                        </th>

                        <th className="px-6 py-5 font-medium">
                            Skills
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {positions.map((position) => (

                        <tr
                            key={position.id}
                            onClick={() =>
                                onSelect(position)
                            }
                            className="cursor-pointer border-b border-slate-900 transition hover:bg-slate-900/40"
                        >

                            {/* Position */}
                            <td className="px-6 py-5">

                                <div>

                                    <h3 className="font-semibold text-white">
                                        {position.title}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-400">
                                        {position.type}
                                    </p>
                                </div>
                            </td>

                            {/* Department */}
                            <td className="px-6 py-5 text-slate-300">
                                {position.department}
                            </td>

                            {/* Location */}
                            <td className="px-6 py-5 text-slate-300">
                                {position.location}
                            </td>

                            {/* Experience */}
                            <td className="px-6 py-5 text-slate-300">
                                {position.experience}
                            </td>

                            {/* Applicants */}
                            <td className="px-6 py-5">

                                <div className="inline-flex rounded-full bg-blue-100 dark:bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-400">
                                    {position.applicants} Applicants
                                </div>
                            </td>

                            {/* Recruiter */}
                            <td className="px-6 py-5 text-slate-300">
                                {position.recruiter}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-5">

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${position.status === "Open"
                                        ? "bg-green-600/20 text-green-400"
                                        : "bg-red-600/20 text-red-400"
                                        }`}
                                >
                                    {position.status}
                                </span>
                            </td>

                            {/* Skills */}
                            <td className="px-6 py-5">

                                <div className="flex flex-wrap gap-2">

                                    {position.skills.map(
                                        (skill, index) => (

                                            <span
                                                key={index}
                                                className="rounded-full bg-violet-100 dark:bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300"
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}