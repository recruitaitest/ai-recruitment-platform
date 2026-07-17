"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Position } from "@/types/positon";

interface Props {
    open: boolean;
    onClose: () => void;
    position: Position | null;
    onSave: (updated: Position) => void;
}

export default function EditPositionModal({
    open,
    onClose,
    position,
    onSave,
}: Props) {
    const [title, setTitle] = useState("");
    const [department, setDepartment] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");
    const [salary, setSalary] = useState("");
    // Skills stored as a comma-separated string (same as CreatePositionModal)
    const [skills, setSkills] = useState("");

    useEffect(() => {
        if (position) {
            setTitle(position.title);
            setDepartment(position.department);
            setLocation(position.location);
            setExperience(position.experience);
            setSalary(position.salary);
            // position.skills may be string[] or string — normalise to string
            setSkills(
                Array.isArray(position.skills)
                    ? position.skills.join(", ")
                    : (position.skills ?? "")
            );
        }
    }, [position]);

    if (!open || !position) return null;

    const handleSave = () => {
        onSave({
            ...position,
            title,
            department,
            location,
            experience,
            salary,
            // Convert back to array so the rest of the app is unaffected
            skills: skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean) as any,
        });
        onClose();
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
                            Edit Position
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Update position details
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
                            onChange={(e) => setTitle(e.target.value)}
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
                            onChange={(e) => setDepartment(e.target.value)}
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
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Bangalore"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Experience */}
                    <div>
                        <label className="mb-2 block text-sm text-slate-300">
                            Experience
                        </label>
                        <input
                            type="text"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
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
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="₹15L - ₹20L"
                            className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                        />
                    </div>

                    {/* Skills — textarea matching CreatePositionModal */}
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
                        onClick={handleSave}
                        className="rounded-2xl bg-violet-600 px-6 py-3 text-white hover:bg-violet-500 transition"
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}