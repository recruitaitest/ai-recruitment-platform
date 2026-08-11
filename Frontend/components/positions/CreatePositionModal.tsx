"use client";

import { useState } from "react";

import { motion } from "framer-motion";

import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Position } from "@/types/positon";
import { generateAIJobDescription } from "@/services/aiService";


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
 const [description, setDescription] = useState("");
 const [generatingAI, setGeneratingAI] = useState(false);

 const handleGenerateAIDirectly = async () => {
   if (!title.trim()) {
     toast.error("Please enter a Position Title first.");
     return;
   }
   try {
     setGeneratingAI(true);
     const res = await generateAIJobDescription({
       title: title,
       seniority: experience || "Mid-Senior Level",
       key_bullets: skills || title,
       location: location || "Remote",
       department: department
     });
     if (res) {
       if (res.required_skills?.length) {
         setSkills(res.required_skills.join(", "));
       }
       if (res.description_markdown) {
         setDescription(res.description_markdown);
       }
       toast.success("AI generated JD & skills directly!");
     }
   } catch (err) {
     console.error("AI Generation error:", err);
     toast.error("Failed to generate AI JD.");
   } finally {
     setGeneratingAI(false);
   }
 };

 if (!open) return null;

 const handleCreate = async () => {

 if (!title || !location) return;

 try {

 const response = await fetch(
 (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + "/positions/",
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
 description || `${type} position requiring ${experience} experience`,

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] shadow-2xl shadow-slate-900/15 dark:shadow-black/60 overflow-hidden"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Create Position
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add a new hiring position
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid gap-6 p-6 md:grid-cols-2 overflow-y-auto flex-1">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Position Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Developer"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
            />
          </div>

          {/* Department */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            >
              <option>Engineering</option>
              <option>Design</option>
              <option>HR</option>
              <option>Marketing</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
            />
          </div>

          {/* Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Employment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            >
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Experience
            </label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="3-5 Years"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
            />
          </div>

          {/* Salary */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Salary Range
            </label>
            <input
              type="text"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="₹15L - ₹20L"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
            />
          </div>

          {/* Openings */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Openings
            </label>
            <input
              type="number"
              min={1}
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value))}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>

          {/* Skills */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Skills & Requirements
              </label>
              <button
                type="button"
                onClick={handleGenerateAIDirectly}
                disabled={generatingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow transition-all disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingAI ? "Generating JD & Skills..." : "✨ Auto-Generate JD & Skills with AI"}
              </button>
            </div>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Node.js, TypeScript (comma separated)"
              rows={2}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400"
            />
          </div>

          {/* Job Description */}
          {description && (
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Generated Job Description (Markdown)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-400 font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800/80 px-6 py-5">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Create Position
          </button>
        </div>
      </motion.div>
    </motion.div>
 );
}