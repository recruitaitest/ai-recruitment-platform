"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, ArrowRight, Search, Sparkles } from "lucide-react";
import { AICareerChatbot } from "@/components/engagement/AICareerChatbot";

interface Position {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  required_skills: string;
}

export default function CareerPortalPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const filteredPositions = positions.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase()) ||
    (p.required_skills && p.required_skills.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 py-16 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full" />
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Official Career Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Build the Future With Us
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore open roles, apply in seconds, and join a team shaping modern AI-driven solutions.
          </p>

          {/* Search Box */}
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search position titles, locations, or skills..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 shadow-md text-sm transition-all"
            />
          </div>
        </div>
      </header>

      {/* Positions Grid */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Open Opportunities</h2>
            <p className="text-xs text-slate-500 mt-1">Showing {filteredPositions.length} active job listings</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm animate-pulse">
            Loading open job positions...
          </div>
        ) : filteredPositions.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-slate-800 font-semibold text-base">No positions found</h3>
            <p className="text-slate-500 text-xs mt-1">Try refining your search query.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPositions.map((pos) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative bg-white border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-6 transition-all shadow-sm hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {pos.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                      Actively Hiring
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {pos.company || "Our Organization"}
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {pos.location || "Remote"}
                    </span>
                  </div>

                  {pos.required_skills && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {pos.required_skills.split(",").slice(0, 5).map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <Link
                    href={`/careers/${pos.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-sm hover:shadow-indigo-500/20"
                  >
                    Apply Now
                    <ArrowRight className="w-3.5 h-3.5" />
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
        © {new Date().getFullYear()} Recruitment Portal · Powered by AI Resume Management Platform
      </footer>
    </div>
  );
}
