"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { Position } from "@/types/positon";
import SkillsTagInput from "./SkillsTagInput";

interface Props {
  open: boolean;
  onClose: () => void;
  position: Position | null;
  onSave: (updated: Position) => void;
}

const EXP_OPTIONS = ["0", "1", "2", "3", "4", "5", "7", "10", "12", "15+"];

export default function EditPositionModal({
  open,
  onClose,
  position,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Experience Structured State
  const [minExp, setMinExp] = useState("1");
  const [maxExp, setMaxExp] = useState("3");

  // Salary Structured State
  const [currency, setCurrency] = useState("₹");
  const [minSalary, setMinSalary] = useState("15");
  const [maxSalary, setMaxSalary] = useState("20");
  const [salaryPeriod, setSalaryPeriod] = useState("LPA");

  const [skillsList, setSkillsList] = useState<string[]>([]);

  useEffect(() => {
    if (position) {
      setTitle(position.title || "");
      setDepartment(position.department || "Engineering");
      setLocation(position.location || "");
      setDescription(position.description || "");

      // Parse Experience String (e.g., "3 - 5 Years" or "3-5 Years")
      if (position.experience) {
        const matches = position.experience.match(/\d+/g);
        if (matches && matches.length >= 2) {
          setMinExp(matches[0]);
          setMaxExp(matches[1]);
        } else if (matches && matches.length === 1) {
          setMinExp(matches[0]);
          setMaxExp(matches[0]);
        }
      }

      // Parse Salary String (e.g., "₹15 - ₹20 LPA" or "₹40000 / Month")
      if (position.salary) {
        const salStr = position.salary;
        if (salStr.includes("$")) setCurrency("$");
        else if (salStr.includes("€")) setCurrency("€");
        else if (salStr.includes("£")) setCurrency("£");
        else setCurrency("₹");

        if (salStr.toLowerCase().includes("month")) setSalaryPeriod("Monthly");
        else if (salStr.toLowerCase().includes("yearly")) setSalaryPeriod("Yearly");
        else setSalaryPeriod("LPA");

        const nums = salStr.match(/\d+/g);
        if (nums && nums.length >= 2) {
          setMinSalary(nums[0]);
          setMaxSalary(nums[1]);
        } else if (nums && nums.length === 1) {
          setMinSalary(nums[0]);
          setMaxSalary(nums[0]);
        }
      }

      // Parse Skills Array or Comma String
      if (Array.isArray(position.skills)) {
        setSkillsList(position.skills);
      } else if (typeof position.skills === "string") {
        setSkillsList(
          (position.skills as string)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        );
      } else {
        setSkillsList([]);
      }
    }
  }, [position]);

  if (!open || !position) return null;

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

  const handleSave = () => {
    const formattedExperience = `${minExp} - ${maxExp} Years`;
    const formattedSalary =
      salaryPeriod === "Monthly"
        ? `${currency}${minSalary} / Month`
        : `${currency}${minSalary} - ${currency}${maxSalary} ${salaryPeriod}`;

    onSave({
      ...position,
      title,
      department,
      location,
      description,
      experience: formattedExperience,
      salary: formattedSalary,
      skills: skillsList as any,
    });
    onClose();
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
              Edit Position
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update position details
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
              Position Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Frontend Developer"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none text-sm font-medium"
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
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bangalore"
              className="w-full rounded-xl bg-slate-50 dark:bg-[#161C2C] border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white px-4 py-3 outline-none text-sm font-medium"
            />
          </div>

          {/* Structured Experience Input */}
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
                  <option key={`edit-min-${opt}`} value={opt}>
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
                  <option key={`edit-max-${opt}`} value={opt}>
                    Max: {opt} Yrs
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Structured Salary Range Input */}
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

          {/* Skills Tag Input */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Skills & Requirements (Tag Chips)
            </label>
            <SkillsTagInput
              tags={skillsList}
              onChange={setSkillsList}
              placeholder="Type skill and press Enter or comma..."
            />
          </div>

          {/* Always Display Job Description Field */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Job Description (Markdown)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter job description details..."
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
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 shadow"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}