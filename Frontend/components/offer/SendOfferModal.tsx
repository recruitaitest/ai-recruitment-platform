"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, File, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendOfferModalProps {
  open: boolean;
  onClose: () => void;
  offerId?: number;
  candidateName?: string;
  onOfferSent: () => void;
}

export default function SendOfferModal({
  open,
  onClose,
  offerId,
  candidateName,
  onOfferSent,
}: SendOfferModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setIsSending(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSend = async () => {
    if (!file || !offerId) {
      toast.error("Please upload the signed offer letter PDF first.");
      return;
    }

    setIsSending(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/offers/${offerId}/upload-letter`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to send offer");
      }

      toast.success("Offer letter uploaded and sent to candidate!");
      onOfferSent();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while sending the offer.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isSending ? onClose : undefined}
            className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="
              relative w-full max-w-md overflow-hidden rounded-2xl
              bg-white dark:bg-surface
              border border-slate-200 dark:border-border
              shadow-2xl shadow-slate-900/15 dark:shadow-black/60
              z-10 flex flex-col
            "
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-text-primary">
                  Send Offer Letter to {candidateName || "Candidate"}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-muted">
                  Attach signed letter and notify candidate
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isSending}
                className="rounded-full p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-hover dark:hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-indigo-700 dark:text-indigo-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-indigo-500 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  Please upload the signed offer letter as a PDF. Once uploaded, an email will be automatically sent to the candidate with the attachment, and the offer status will be updated to &quot;Sent&quot;.
                </p>
              </div>

              <div
                onClick={() => !isSending && fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition ${
                  file
                    ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10"
                    : "border-slate-200 dark:border-border bg-slate-50/50 dark:bg-surface-hover/40 hover:border-indigo-400 hover:bg-indigo-50/20"
                } ${isSending ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 p-3 text-indigo-600 dark:text-indigo-400">
                      <File className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-text-primary">{file.name}</p>
                    <p className="text-xs text-slate-500 dark:text-muted mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <span className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Change File
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 rounded-2xl bg-slate-100 dark:bg-surface-hover p-3 text-slate-500 dark:text-muted">
                      <UploadCloud className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-text-primary">
                      Click to upload PDF
                    </p>
                    <p className="text-xs text-slate-400 dark:text-muted mt-1">
                      PDF only (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 dark:border-border px-6 py-4 bg-slate-50/50 dark:bg-surface">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-surface text-slate-700 dark:text-text-secondary text-sm font-semibold hover:bg-slate-50 dark:hover:bg-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!file || isSending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Offer"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
