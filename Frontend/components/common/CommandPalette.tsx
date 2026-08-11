"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  KanbanSquare,
  Briefcase,
  CalendarDays,
  FileText,
  Zap,
  Upload,
  Plus,
  ArrowRight,
  Command,
  X,
  Mail,
  BarChart3,
  Settings,
  LayoutGrid,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const navigationItems = [
    { id: "nav-dashboard", title: "Recruiter Dashboard", subtitle: "Overview metrics & workspace", icon: LayoutGrid, href: "/dashboard", category: "Navigation" },
    { id: "nav-candidates", title: "Candidates Directory", subtitle: "View all candidates & AI scores", icon: Users, href: "/candidates", category: "Navigation" },
    { id: "nav-pipeline", title: "Pipeline Kanban Board", subtitle: "Drag & drop stage management", icon: KanbanSquare, href: "/pipeline", category: "Navigation" },
    { id: "nav-positions", title: "Open Positions", subtitle: "Job requisitions & sourcing strategies", icon: Briefcase, href: "/positions", category: "Navigation" },
    { id: "nav-interviews", title: "Interview Schedule", subtitle: "Upcoming rounds & AI scorecards", icon: CalendarDays, href: "/interviews", category: "Navigation" },
    { id: "nav-offers", title: "Offer Letters", subtitle: "Generated offers & risk gauge", icon: FileText, href: "/offers", category: "Navigation" },
    { id: "nav-automation", title: "Admin Automation Engine", subtitle: "Auto-advance rules & webhooks", icon: Zap, href: "/admin/automation", category: "Navigation" },
    { id: "nav-upload", title: "Bulk Resume Upload", subtitle: "ZIP & batch parsing dropzone", icon: Upload, href: "/resume-upload", category: "Navigation" },
    { id: "nav-analytics", title: "Recruitment Analytics", subtitle: "Metrics & time-to-hire reports", icon: BarChart3, href: "/analytics", category: "Navigation" },
    { id: "nav-mailbox", title: "Mailbox & Email Sync", subtitle: "Candidate emails & inbox", icon: Mail, href: "/mailbox", category: "Navigation" },
    { id: "nav-settings", title: "Account Settings", subtitle: "Manage preferences & team", icon: Settings, href: "/settings", category: "Navigation" },
  ];

  const quickActions = [
    { id: "action-upload", title: "Upload Resumes (Bulk ZIP)", subtitle: "Batch parse resumes into candidates", icon: Upload, href: "/resume-upload", category: "Quick Action" },
    { id: "action-position", title: "Create New Position", subtitle: "Generate JD with AI & open req", icon: Plus, href: "/positions", category: "Quick Action" },
    { id: "action-interview", title: "Schedule Interview", subtitle: "Book interview round & send invite", icon: CalendarDays, href: "/interviews", category: "Quick Action" },
    { id: "action-automation", title: "Configure Automation Rules", subtitle: "Set auto-advance thresholds", icon: Zap, href: "/admin/automation", category: "Quick Action" },
  ];

  const allItems = [...navigationItems, ...quickActions];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredItems[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleSelect = (item: (typeof allItems)[0]) => {
    router.push(item.href);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-text-primary cursor-default"
        >
          {/* Header Input */}
          <div className="flex items-center px-4 py-3.5 border-b border-border bg-secondary-surface/40">
            <Command className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command, jump to page, or search actions... (Esc or click outside to close)"
              className="w-full bg-transparent text-text-primary placeholder-muted outline-none text-sm font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-md text-muted hover:text-text-primary transition mr-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-border text-muted hover:text-text-primary hover:bg-secondary-surface transition flex items-center gap-1 text-xs font-semibold"
              title="Close Command Palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Item List */}
          <div className="max-h-[380px] overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-muted">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No commands found for &quot;{query}&quot;</p>
                <p className="text-xs text-muted mt-1">Try searching for &quot;Dashboard&quot;, &quot;Candidates&quot;, or &quot;Upload&quot;</p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const IconComponent = item.icon;
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-600/10 text-blue-500 dark:bg-blue-500/15"
                        : "hover:bg-secondary-surface/50 text-text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-secondary-surface text-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-text-primary"}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted truncate">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary-surface border border-border text-muted">
                        {item.category}
                      </span>
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? "translate-x-0.5 text-blue-500 opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Keyboard hints */}
          <div className="px-4 py-2.5 border-t border-border bg-secondary-surface/30 flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">Ctrl + K</kbd>
              Toggle
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
