"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      category: "Global Shortcuts",
      items: [
        { keys: ["Ctrl", "K"], description: "Toggle Command Palette & Quick Search" },
        { keys: ["?"], description: "Open Keyboard Shortcuts Help" },
        { keys: ["Esc"], description: "Close Active Modal / Drawer" },
      ],
    },
    {
      category: "Quick Navigation (Press sequence)",
      items: [
        { keys: ["g", "d"], description: "Go to Dashboard Overview" },
        { keys: ["g", "c"], description: "Go to Candidates Directory" },
        { keys: ["g", "p"], description: "Go to Pipeline Kanban Board" },
        { keys: ["g", "j"], description: "Go to Open Positions" },
        { keys: ["g", "i"], description: "Go to Interviews Schedule" },
        { keys: ["g", "a"], description: "Go to Admin Automation Center" },
      ],
    },
    {
      category: "Candidate Actions (on Candidates Page)",
      items: [
        { keys: ["c"], description: "Compare Selected Candidates (when 2+ selected)" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-text-primary cursor-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary-surface/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Keyboard Shortcuts</h3>
                <p className="text-xs text-muted">Quick hotkeys for power productivity</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-text-primary hover:bg-secondary-surface transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[450px] overflow-y-auto">
            {shortcuts.map((section) => (
              <div key={section.category}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  {section.category}
                </h4>
                <div className="space-y-2.5">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary-surface/30 border border-border/50"
                    >
                      <span className="text-xs font-medium text-text-primary">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((k, ki) => (
                          <kbd
                            key={ki}
                            className="px-2 py-1 text-xs font-bold font-mono text-text-primary bg-surface border border-border rounded-md shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border bg-secondary-surface/30 flex items-center justify-between text-xs text-muted">
            <span>Press <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded text-[10px]">?</kbd> anytime to open this helper</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
