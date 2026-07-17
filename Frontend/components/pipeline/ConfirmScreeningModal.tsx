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
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 z-[100] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                            <h2 className="text-xl font-semibold text-white">
                                Move to Screening
                            </h2>
                            <button
                                onClick={onClose}
                                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="mb-6 text-sm text-slate-300">
                                You are about to move <strong>{candidateName}</strong> to the Screening round. Please complete the following verification step:
                            </p>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={confirmedInterest}
                                        onChange={(e) => setConfirmedInterest(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="h-5 w-5 rounded border border-slate-600 bg-slate-900 transition peer-checked:border-blue-500 peer-checked:bg-blue-600 group-hover:border-slate-500" />
                                    <CheckCircle2 className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition peer-checked:opacity-100" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-slate-200">
                                    I have verified that the candidate is actively interested in this role.
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-5">
                            <button
                                onClick={onClose}
                                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!confirmedInterest}
                                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white transition ${
                                    confirmedInterest 
                                        ? "bg-blue-600 hover:bg-blue-500" 
                                        : "bg-blue-600/50 cursor-not-allowed opacity-70"
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
