"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Building2, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import api from "@/lib/api";

interface ConnectMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectMailboxModal({
  isOpen,
  onClose,
}: ConnectMailboxModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  const handleConnect = async (provider: string) => {
    try {
      setIsLoading(true);
      setConnectingProvider(provider);
      const response = await api.post("/mailbox/connect");
      if (response.data && response.data.authorization_url) {
        window.location.href = response.data.authorization_url;
      } else {
        console.error("No authorization URL received");
      }
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
    } finally {
      setIsLoading(false);
      setConnectingProvider(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="
              relative w-full max-w-lg overflow-hidden rounded-2xl
              bg-white dark:bg-surface
              border border-slate-200 dark:border-border
              shadow-2xl shadow-slate-900/15 dark:shadow-black/60
              z-10
            "
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">
                    Connect Mailbox
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                    <Sparkles className="h-3 w-3" /> Auto Sync
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-muted">
                  Connect recruiter inboxes for automated resume ingestion.
                </p>
              </div>

              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="space-y-4 p-6">
              {/* Office365 Card */}
              <button
                onClick={() => handleConnect("Office365")}
                disabled={isLoading}
                className={`
                  group w-full text-left rounded-2xl p-5
                  bg-slate-50 hover:bg-indigo-50/60 dark:bg-surface-hover/50 dark:hover:bg-surface-hover
                  border border-slate-200/80 hover:border-indigo-500/40 dark:border-border dark:hover:border-primary/40
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                    <Building2 className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Microsoft Office365
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>

                    <p className="mt-1 text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                      Sync recruiter inboxes & shared mailboxes via Microsoft Graph API.
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Secure OAuth 2.0 Authentication
                    </div>
                  </div>
                </div>
              </button>

              {/* Gmail Card */}
              <button
                onClick={() => handleConnect("Gmail")}
                disabled={isLoading}
                className={`
                  group w-full text-left rounded-2xl p-5
                  bg-slate-50 hover:bg-rose-50/60 dark:bg-surface-hover/50 dark:hover:bg-surface-hover
                  border border-slate-200/80 hover:border-rose-500/40 dark:border-border dark:hover:border-rose-500/40
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 group-hover:scale-105 transition-transform">
                    <Mail className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-text-primary group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        Google Gmail
                      </h3>
                      <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
                    </div>

                    <p className="mt-1 text-xs text-slate-600 dark:text-text-secondary leading-relaxed">
                      Connect Gmail accounts for automated candidate email & resume processing.
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Google Verified Authentication
                    </div>
                  </div>
                </div>
              </button>

              {/* Footer Notice */}
              <div className="rounded-xl bg-indigo-50/80 dark:bg-primary-soft/40 border border-indigo-100 dark:border-primary/30 p-4">
                <p className="text-xs text-indigo-900 dark:text-text-primary leading-relaxed">
                  <strong className="font-semibold">Automated Ingestion:</strong> Connected mailboxes will automatically sync applicant emails, extract PDF/DOCX resume attachments, and generate candidate profiles in real time.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}