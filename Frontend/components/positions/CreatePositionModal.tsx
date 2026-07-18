"use client";

import { useState } from "react";

import { motion } from "framer-motion";

import { X } from "lucide-react";

import type { Position } from "@/types/positon";


interface Props {
    open: boolean;
    onClose: () => void;
    onCreate: (position: Position) => void;
}

export default function CreatePositionModal({
    open,
    onClose,
    onCreate,
}: Props) {
    const [title, setTitle] = useState("");
    const [department, setDepartment] =
        useState("Engineering");

    const [location, setLocation] =
        useState("");

    const [type, setType] =
        useState("Full Time");

    const [experience, setExperience] =
        useState("");

    const [salary, setSalary] = useState("");

    const [openings, setOpenings] =
        useState(1);

    const [skills, setSkills] = useState("");

    if (!open) return null;

    const handleCreate = async () => {

        if (!title || !location) return;

        try {

            const response = await fetch(
                (process.env.NEXT_PUBLIC_API_URL || (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')) + "/positions/",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({

                        title: title,

                        company: department,

                        location: location,

                        description:
                            `${type} position requiring ${experience} experience`,

                        required_skills: skills,
                    }),
                }
            );

            const data = await response.json();

            const newPosition: Position = {

                id: data.id,

                title: data.title,

                department: data.company,

                location: data.location,

                type: type,

                experience: experience,

                salary: salary,

                openings: openings,

                applicants: 0,

                status: "Open",

                recruiter: "Current Recruiter",

                postedDate:
                    new Date().toISOString(),

                skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
            };

            onCreate(newPosition);

            onClose();

            setTitle("");
            setDepartment("Engineering");
            setLocation("");
            setType("Full Time");
            setExperience("");
            setSalary("");
            setOpenings(1);
            setSkills("");

        } catch (error) {

            console.log(error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        >

            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
            >

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                    <div>

                        <h2 className="text-2xl font-bold text-white">
                            Create Position
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            Add a new hiring position
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl p-2 hover:bg-slate-800 transition"
                    >
                        <X className="h-5 w-5 text-slate-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="grid gap-6 p-6 md:grid-cols-2 overflow-y-auto flex-1">

                    {/* Title */}
                    <div className="md:col-span-2">

                        <label className="mb-2 block text-sm text-slate-300">
                            Position Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                            placeholder="Senior Frontend Developer"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Department */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Department
                        </label>

                        <select
                            value={department}
                            onChange={(e) =>
                                setDepartment(e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                        >
                            <option>Engineering</option>
                            <option>Design</option>
                            <option>HR</option>
                            <option>Marketing</option>
                        </select>
                    </div>

                    {/* Location */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Location
                        </label>

                        <input
                            type="text"
                            value={location}
                            onChange={(e) =>
                                setLocation(e.target.value)
                            }
                            placeholder="Bangalore"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Type */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Employment Type
                        </label>

                        <select
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                        >
                            <option>Full Time</option>
                            <option>Part Time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </select>
                    </div>

                    {/* Experience */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Experience
                        </label>

                        <input
                            type="text"
                            value={experience}
                            onChange={(e) =>
                                setExperience(e.target.value)
                            }
                            placeholder="3-5 Years"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Salary */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Salary Range
                        </label>

                        <input
                            type="text"
                            value={salary}
                            onChange={(e) =>
                                setSalary(e.target.value)
                            }
                            placeholder="₹15L - ₹20L"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Openings */}
                    <div>

                        <label className="mb-2 block text-sm text-slate-300">
                            Openings
                        </label>

                        <input
                            type="number"
                            min={1}
                            value={openings}
                            onChange={(e) =>
                                setOpenings(
                                    Number(e.target.value)
                                )
                            }
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                        />
                    </div>

                    {/* Skills */}
                    <div className="md:col-span-2">

                        <label className="mb-3 block text-sm text-slate-300">
                            Skills
                        </label>

                        <textarea
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                            placeholder="e.g. React, Node.js, TypeScript (comma separated)"
                            rows={3}
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-4 border-t border-slate-800 px-6 py-5">

                    <button
                        onClick={onClose}
                        className="rounded-2xl border border-slate-700 px-5 py-3 text-slate-300 hover:bg-slate-800 transition"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleCreate}
                        className="rounded-2xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-500 transition"
                    >
                        Create Position
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}