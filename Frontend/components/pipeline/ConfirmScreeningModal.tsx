"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ConfirmScreeningModalProps {
 open: boolean;
 onClose: () => void;
 candidateName: string;
 onConfirm: () => void;
}

export default function ConfirmScreeningModal({
 open,
 onClose,
 candidateName,
 onConfirm,
}: ConfirmScreeningModalProps) {
 const [confirmedInterest, setConfirmedInterest] = useState(false);

 useEffect(() => {
 if (!open) {
 setConfirmedInterest(false);
 }
 }, [open]);

 const handleConfirm = () => {
 if (!confirmedInterest) {
 toast.error("Please confirm the candidate is interested in the role.");
 return;
 }
 onConfirm();
 };

 return (
 <AnimatePresence>
 {open && (
 <>
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={onClose}
 className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
 />

 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: 20 }}
 className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden"
 >
 <div className="flex items-center justify-between border-b border-border px-6 py-5 bg-surface">
 <h2 className="text-xl font-semibold text-text-primary">
 Move to Screening
 </h2>
 <button
 onClick={onClose}
 className="rounded-xl p-2 text-muted dark:text-muted hover:bg-slate-100 dark:hover:bg-secondary-surface hover:text-slate-900 dark:hover:text-text-primary transition"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="p-6">
 <p className="mb-6 text-sm text-slate-800 dark:text-primary">
 You are about to move <strong className="text-slate-900 dark:text-text-primary">{candidateName}</strong> to the Screening round. Please complete the following verification step:
 </p>

 <label className="flex items-start gap-3 cursor-pointer group">
 <div className="relative flex items-center">
 <input
 type="checkbox"
 checked={confirmedInterest}
 onChange={(e) => setConfirmedInterest(e.target.checked)}
 className="peer sr-only"
 />
 <div className="h-5 w-5 rounded border border-border bg-surface transition peer-checked:border-primary peer-checked:bg-primary group-hover:border-border" />
 <CheckCircle2 className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-text-primary opacity-0 transition peer-checked:opacity-100" strokeWidth={3} />
 </div>
 <span className="text-sm font-semibold text-slate-900 dark:text-primary">
 I have verified that the candidate is actively interested in this role.
 </span>
 </label>
 </div>

 <div className="flex items-center justify-end gap-3 border-t border-border dark:border-border px-6 py-5">
 <button
 onClick={onClose}
 className="rounded-xl border border-border dark:border-border px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-secondary hover:bg-slate-50 dark:hover:bg-secondary-surface transition"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirm}
 disabled={!confirmedInterest}
 className={`rounded-xl px-5 py-2.5 text-sm font-medium text-text-primary transition ${
 confirmedInterest 
 ? "bg-primary hover:bg-primary-hover active:scale-[0.97]" 
 : "bg-primary/50 cursor-not-allowed opacity-70"
 }`}
 >
 Confirm Move
 </button>
 </div>
 </motion.div>
 </>
 )}
 </AnimatePresence>
 );
}
