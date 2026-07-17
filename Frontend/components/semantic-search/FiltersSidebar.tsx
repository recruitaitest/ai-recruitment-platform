"use client";
import { useState } from "react";
interface FiltersSidebarProps {
    filters: any;
    setFilters: React.Dispatch<React.SetStateAction<any>>;
}
export default function FiltersSidebar({
    filters,
    setFilters,
}: FiltersSidebarProps
) {
    const selectedSkills = filters.skills;
    return (
        <aside className="w-full rounded-2xl border bg-card p-5 shadow-sm lg:w-[300px]">

            {/* Title */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold">
                    Filters
                </h2>

                <p className="text-sm text-muted-foreground">
                    Refine candidate search results
                </p>
            </div>

            <div className="space-y-6">

                {/* Experience */}
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Experience
                    </label>

                    <select
                        value={filters.experience}
                        onChange={(e) =>
                            setFilters((prev: any) => ({
                                ...prev,
                                experience: e.target.value,
                            }))
                        }
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm text-black outline-none focus:border-blue-500"
                    >    <option>All Experience</option>
                        <option>0 - 2 Years</option>
                        <option>3 - 5 Years</option>
                        <option>5+ Years</option>
                    </select>
                </div>

                {/* Location */}
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Location
                    </label>

                    <select
                        value={filters.location}
                        onChange={(e) =>
                            setFilters((prev: any) => ({
                                ...prev,
                                location: e.target.value,
                            }))
                        }
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm text-black outline-none focus:border-blue-500"
                    >
                        <option>All Locations</option>
                        <option>Hyderabad</option>
                        <option>Bangalore</option>
                        <option>Remote</option>
                    </select>
                </div>

                {/* Skills */}
                <div>
                    <label className="mb-2 block text-sm font-medium">
                        Skills
                    </label>

                    <div className="flex flex-wrap gap-2">
                        {[
                            "React",
                            "Node.js",
                            "Python",
                            "AWS",
                            "TypeScript",
                        ].map((skill) => {

                            const isSelected =
                                selectedSkills.includes(skill);

                            return (
                                <button
                                    key={skill}
                                    onClick={() => {

                                        const updatedSkills = isSelected
                                            ? selectedSkills.filter(
                                                (item: string) => item !== skill
                                            )
                                            : [...selectedSkills, skill];

                                        setFilters((prev: any) => ({
                                            ...prev,
                                            skills: updatedSkills,
                                        }));
                                    }}
                                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${isSelected
                                        ? "bg-white text-black border-black hover:bg-gray-200"
                                        : "bg-black text-white border-black"
                                        }`}
                                >
                                    {skill}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={() =>
                        setFilters({
                            experience: "",
                            location: "",
                            skills: [],
                        })
                    }
                    className="w-full rounded-xl border py-2 text-sm font-medium transition hover:bg-muted"
                >
                    Clear Filters
                </button>
            </div>
        </aside>
    );
}