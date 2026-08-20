"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, DollarSign, Calendar, FileText, CheckCircle2, Clock } from "lucide-react";
import { getOffer } from "@/services/offerService";

interface Props {
  open: boolean;
  onClose: () => void;
  offerId?: number;
}

export default function ViewOfferModal({ open, onClose, offerId }: Props) {
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && offerId) {
      setLoading(true);
      getOffer(offerId)
        .then((data) => setOffer(data))
        .catch((err) => console.error("Failed to load offer:", err))
        .finally(() => setLoading(false));
    } else {
      setOffer(null);
    }
  }, [open, offerId]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="
            relative w-full max-w-2xl overflow-hidden rounded-2xl
            bg-white dark:bg-surface
            border border-slate-200 dark:border-border
            shadow-2xl shadow-slate-900/15 dark:shadow-black/60
            z-10 max-h-[90vh] flex flex-col
          "
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">
                Offer Details for {offer?.candidate_name || "Candidate"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-muted">
                Candidate offer details and compensation package
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-5 p-6 overflow-y-auto flex-1">
            {loading ? (
              <div className="text-slate-500 dark:text-muted text-sm py-4 text-center">Loading offer details...</div>
            ) : offer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /> Status
                    </label>
                    <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5 text-sm font-semibold text-text-primary">
                      {offer.status || "Draft"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-indigo-500" /> Employment Type
                    </label>
                    <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5 text-sm font-semibold text-text-primary">
                      {offer.employment_type || "Full Time"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-indigo-500" /> Salary Package
                  </label>
                  <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {offer.salary}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-500" /> Joining Date
                    </label>
                    <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5 text-sm text-text-primary">
                      {offer.joining_date || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-500" /> Offer Expiry
                    </label>
                    <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-2.5 text-sm text-text-primary">
                      {offer.offer_expiry || "-"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-primary mb-1 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" /> Notes / Terms
                  </label>
                  <div className="rounded-xl bg-surface-hover/60 dark:bg-surface-hover/40 border border-border px-4 py-3 text-sm text-text-primary whitespace-pre-wrap">
                    {offer.notes || "None"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-slate-500 dark:text-muted">Offer details not found.</div>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end border-t border-slate-100 dark:border-border px-6 py-4 bg-slate-50/50 dark:bg-surface">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
