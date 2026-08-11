"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, ArrowRight, Search, Sparkles, Sun, Moon } from "lucide-react";
import { AICareerChatbot } from "@/components/engagement/AICareerChatbot";
import { getTheme, toggleTheme } from "@/utils/theme";

interface Position {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string;
}

export default function ModularCareersPortalPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setTheme(getTheme() as "light" | "dark");
    async function fetchPositions() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${API}/portal/positions`);
        if (res.ok) {
          const data = await res.json();
          setPositions(data);
        }
      } catch (err) {
        console.error("Failed to load positions", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPositions();
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = toggleTheme();
    setTheme(nextTheme as "light" | "dark");
  };

  const filteredPositions = positions.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      (p.required_skills && p.required_skills.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border bg-surface py-12 px-6 shadow-md transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Official Careers Portal
          </div>
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl bg-secondary-surface border border-border text-text-primary hover:bg-border/40 transition flex items-center gap-2 text-xs font-semibold"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span className="capitalize">{theme} Mode</span>
          </button>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-text-primary">
            Build the Future With Us
          </h1>
          <p className="text-muted text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore open roles, apply in seconds, and join a team shaping modern AI-driven solutions.
          </p>

          {/* Search Bar */}
          <div className="pt-6 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job title, skills, or location..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Positions Grid */}
      <main className="max-w-5xl mx-auto py-12 px-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Available Openings ({filteredPositions.length})
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading available opportunities...</div>
        ) : filteredPositions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
            No active positions found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPositions.map((pos) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-600 px-2.5 py-1 rounded-md bg-indigo-50">
                      {pos.company || "RecruitAI Labs"}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {pos.location || "Remote"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{pos.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{pos.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Skills: {pos.required_skills || "Python, React"}
                  </span>
                  <Link
                    href={`/careers/${pos.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* AI Career Assistant Floating Widget */}
      <AICareerChatbot />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Careers Portal · Powered by AI Resume Management Platform
      </footer>
    </div>
  );
}
