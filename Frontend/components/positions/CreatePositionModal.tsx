"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Position } from "@/types/positon";
import { generateAIJobDescription } from "@/services/aiService";
import SkillsTagInput from "./SkillsTagInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (position: Position) => void;
}

const EXP_OPTIONS = ["0", "1", "2", "3", "4", "5", "7", "10", "12", "15+"];

export default function CreatePositionModal({
  open,
  onClose,
  onCreate,
}: Props) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full Time");

  // Experience Structured State
  const [minExp, setMinExp] = useState("1");
  const [maxExp, setMaxExp] = useState("3");

  // Salary Structured State
  const [currency, setCurrency] = useState("₹");
  const [minSalary, setMinSalary] = useState("15");
  const [maxSalary, setMaxSalary] = useState("20");
  const [salaryPeriod, setSalaryPeriod] = useState("LPA");

  const [openings, setOpenings] = useState(1);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  const handleMinExpChange = (val: string) => {
    setMinExp(val);
    const minVal = parseInt(val) || 0;
    const maxVal = parseInt(maxExp) || 0;
    if (maxVal < minVal && maxExp !== "15+") {
      setMaxExp((minVal + 1).toString());
    }
  };

  const handleMinSalaryChange = (val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setMinSalary(num.toString());
    const maxNum = parseInt(maxSalary) || 0;
    if (maxNum <= num && salaryPeriod !== "Monthly") {
      setMaxSalary((num + 1).toString());
    }
  };

  const handleMaxSalaryChange = (val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    const minNum = parseInt(minSalary) || 0;
    if (num < minNum) {
      setMaxSalary((minNum + 1).toString());
    } else {
      setMaxSalary(num.toString());
    }
  };

  const handleGenerateAIDirectly = async () => {
    if (!title.trim()) {
      toast.error("Please enter a Position Title first.");
      return;
    }
    try {
      setGeneratingAI(true);
      const expString = `${minExp}-${maxExp} Years`;
      const res = await generateAIJobDescription({
        title: title,
        seniority: expString,
        key_bullets: skillsList.join(", ") || title,
        location: location || "Remote",
        department: department,
      });
      if (res) {
        if (res.required_skills?.length) {
          setSkillsList(res.required_skills);
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
    if (!title || !location) {
      toast.error("Position Title and Location are required.");
      return;
    }

    const formattedExperience = `${minExp} - ${maxExp} Years`;
    const formattedSalary =
      salaryPeriod === "Monthly"
        ? `${currency}${minSalary} / Month`
        : `${currency}${minSalary} - ${currency}${maxSalary} ${salaryPeriod}`;
    const skillsString = skillsList.join(", ");

    try {
      const response = await fetch(
        (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/positions/",
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
              description || `${type} position requiring ${formattedExperience} experience`,
            required_skills: skillsString,
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
        experience: formattedExperience,
        salary: formattedSalary,
        openings: openings,
        applicants: 0,
        status: "Open",
        recruiter: "Current Recruiter",
        postedDate: new Date().toISOString(),
        skills: skillsList,
      };

      onCreate(newPosition);
      onClose();

      // Reset Form State
      setTitle("");
      setDepartment("Engineering");
      setLocation("");
      setType("Full Time");
      setMinExp("1");
      setMaxExp("3");
      setCurrency("₹");
      setMinSalary("15");
      setMaxSalary("20");
      setSalaryPeriod("LPA");
      setOpenings(1);
      setSkillsList([]);
      setDescription("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create position.");
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
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1B2337] border border-slate-200 dark:border-[#26324A] shadow-2xl overflow-hidden"
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

        {/* Body Grid */}
        <div className="grid gap-6 p-6 md:grid-cols-2 overflow-y-auto flex-1">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Position Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Developer"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 text-sm font-medium placeholder:text-slate-400"
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
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none text-sm font-medium"
            >
              <option>Engineering</option>
              <option>Design</option>
              <option>HR</option>
              <option>Marketing</option>
              <option>Product</option>
              <option>Sales</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore / Remote"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none focus:border-indigo-500/50 placeholder:text-slate-400 text-sm font-medium"
            />
          </div>

          {/* Employment Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Employment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none text-sm font-medium"
            >
              <option>Full Time</option>
              <option>Part Time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
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
              onChange={(e) => setOpenings(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none text-sm font-medium"
            />
          </div>

          {/* 1. Structured Experience Input */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Experience Range (Years)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={minExp}
                onChange={(e) => handleMinExpChange(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-3 text-xs font-medium outline-none"
              >
                {EXP_OPTIONS.map((opt) => (
                  <option key={`min-${opt}`} value={opt}>
                    Min: {opt} Yrs
                  </option>
                ))}
              </select>
              <select
                value={maxExp}
                onChange={(e) => setMaxExp(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-3 text-xs font-medium outline-none"
              >
                {EXP_OPTIONS.map((opt) => (
                  <option key={`max-${opt}`} value={opt}>
                    Max: {opt} Yrs
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Structured Salary Range Input */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {salaryPeriod === "Monthly" ? "Monthly Salary Amount" : "Salary Range"}
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-2.5 py-3 text-xs font-semibold outline-none shrink-0"
              >
                <option value="₹">₹ (INR)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
              </select>

              {salaryPeriod === "Monthly" ? (
                /* Single Monthly Salary Input */
                <input
                  type="number"
                  min={0}
                  value={minSalary}
                  onChange={(e) => handleMinSalaryChange(e.target.value)}
                  placeholder="40000"
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-3 text-xs font-medium outline-none placeholder:text-slate-400"
                />
              ) : (
                /* Min - Max Range Inputs */
                <>
                  <input
                    type="number"
                    min={0}
                    value={minSalary}
                    onChange={(e) => handleMinSalaryChange(e.target.value)}
                    placeholder="Min"
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-3 text-xs font-medium outline-none placeholder:text-slate-400"
                  />
                  <span className="text-slate-400 font-bold text-xs">-</span>
                  <input
                    type="number"
                    min={0}
                    value={maxSalary}
                    onChange={(e) => handleMaxSalaryChange(e.target.value)}
                    placeholder="Max"
                    className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-3 py-3 text-xs font-medium outline-none placeholder:text-slate-400"
                  />
                </>
              )}

              <select
                value={salaryPeriod}
                onChange={(e) => {
                  setSalaryPeriod(e.target.value);
                  if (e.target.value === "Monthly" && parseInt(minSalary) < 1000) {
                    setMinSalary("40000");
                  }
                }}
                className="rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-2.5 py-3 text-xs font-semibold outline-none shrink-0"
              >
                <option value="LPA">LPA</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* 3. Skills Tag Input & AI Button */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Skills & Requirements (Tag Chips)
              </label>
              <button
                type="button"
                onClick={handleGenerateAIDirectly}
                disabled={generatingAI}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generatingAI ? "Generating..." : "✨ Auto-Generate JD & Skills"}
              </button>
            </div>

            <SkillsTagInput
              tags={skillsList}
              onChange={setSkillsList}
              placeholder="Type skill (e.g. React, Node.js) and press Enter or comma..."
            />
          </div>

          {/* 4. Always Display Job Description Textarea */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Job Description (Markdown)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter job description details or click 'Auto-Generate JD & Skills' above..."
              rows={5}
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none font-mono text-xs leading-relaxed placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow"
          >
            Create Position
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}