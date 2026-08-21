"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, File, AlertCircle, Loader2, Send, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { sendOfferDirectly, uploadOfferLetter } from "@/services/offerService";

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
  const [useCustomUpload, setUseCustomUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setIsSending(false);
      setUseCustomUpload(false);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Please upload a valid PDF file.");
        return;
      }
      setFile(selected);
    }
  };

  const handleSend = async () => {
    if (!offerId) return;

    setIsSending(true);

    try {
      if (useCustomUpload && file) {
        await uploadOfferLetter(offerId, file);
        toast.success("Custom offer letter uploaded and sent to candidate!");
      } else {
        const res = await sendOfferDirectly(offerId);
        toast.success(res.message || "Official offer letter sent to candidate!");
      }
      onOfferSent();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "An error occurred while sending the offer.");
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
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-text-primary">
                  Send Offer Letter to {candidateName || "Candidate"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-muted">
                  Dispatch official employment offer via automated email
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
              <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-primary">
                <FileCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-text-primary">
                  The generated corporate Offer Letter PDF will be attached to the formal appointment email and sent directly to the candidate&apos;s email address.
                </p>
              </div>

              {/* Option to toggle custom PDF upload */}
              {!useCustomUpload ? (
                <div className="rounded-xl border border-border bg-surface-hover/30 p-4 text-center space-y-2">
                  <p className="text-xs text-text-secondary">
                    Using system-generated corporate offer letter PDF.
                  </p>
                  <button
                    type="button"
                    onClick={() => setUseCustomUpload(true)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Want to upload a custom signed PDF instead?
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-text-primary">
                      Upload Custom Signed PDF
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomUpload(false);
                        setFile(null);
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Use generated PDF
                    </button>
                  </div>

                  <div
                    onClick={() => !isSending && fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition ${
                      file
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface hover:border-primary/50"
                    } ${isSending ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {file ? (
                      <div className="flex flex-col items-center text-center">
                        <File className="h-8 w-8 text-primary mb-2" />
                        <p className="text-sm font-semibold text-text-primary">{file.name}</p>
                        <span className="mt-2 text-xs font-semibold text-primary hover:underline">
                          Change File
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <UploadCloud className="h-7 w-7 text-text-secondary mb-2" />
                        <p className="text-xs font-semibold text-text-primary">
                          Click to select custom PDF
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border px-6 py-4 bg-surface">
              <button
                type="button"
                onClick={onClose}
                disabled={isSending}
                className="px-4 py-2 rounded-xl border border-border bg-surface text-text-secondary text-xs font-semibold hover:bg-surface-hover transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || (useCustomUpload && !file)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    Send Offer Letter
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
