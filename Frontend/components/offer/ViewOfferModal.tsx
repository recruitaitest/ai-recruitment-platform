"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle2,
  Download,
  Send,
  Sparkles,
  Loader2,
  FileCheck,
} from "lucide-react";
import { getOffer, sendOfferDirectly, fetchOfferPreviewBlob, downloadOfferPdf } from "@/services/offerService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  offerId?: number;
  onOfferSent?: () => void;
  onEdit?: (offer: any) => void;
}

export default function ViewOfferModal({
  open,
  onClose,
  offerId,
  onOfferSent,
  onEdit,
}: Props) {
  const [offer, setOffer] = useState<any>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let currentBlob = "";

    if (open && offerId) {
      setLoading(true);
      setPdfLoading(true);

      getOffer(offerId)
        .then((data) => setOffer(data))
        .catch((err) => {
          console.error("Failed to load offer:", err);
          toast.error("Failed to load offer details.");
        })
        .finally(() => setLoading(false));

      fetchOfferPreviewBlob(offerId)
        .then((blobUrl) => {
          currentBlob = blobUrl;
          setPdfBlobUrl(blobUrl);
        })
        .catch((err) => {
          console.error("Failed to load PDF preview blob:", err);
          toast.error("Failed to render PDF preview.");
        })
        .finally(() => setPdfLoading(false));
    } else {
      setOffer(null);
      setPdfBlobUrl("");
    }

    return () => {
      if (currentBlob) {
        URL.revokeObjectURL(currentBlob);
      }
    };
  }, [open, offerId]);

  if (!open) return null;

  const handleDownload = () => {
    if (!offerId) return;
    downloadOfferPdf(offerId, offer?.offer_letter || `Offer_${offerId}.pdf`);
  };

  const handleSendDirect = async () => {
    if (!offerId) return;
    try {
      setSending(true);
      const res = await sendOfferDirectly(offerId);
      toast.success(res.message || "Offer letter sent successfully to candidate!");
      if (onOfferSent) onOfferSent();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to send offer letter.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="
            relative w-full max-w-6xl h-[90vh] flex flex-col
            rounded-2xl bg-surface border border-border shadow-2xl
            overflow-hidden
          "
        >
          {/* ── Modal Header ── */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4 bg-surface-hover/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  Official Offer Letter — {offer?.candidate_name || "Candidate"}
                </h2>
                <p className="text-xs text-text-secondary">
                  {offer?.position_title || "Position"} · Status:{" "}
                  <span className="font-semibold text-primary">
                    {offer?.status || "Draft"}
                  </span>
                </p>
              </div>
            </div>

            {/* Action Buttons in Header */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>

              {offer?.status === "Draft" && (
                <button
                  onClick={handleSendDirect}
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] transition disabled:opacity-50 cursor-pointer"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send to Candidate
                    </>
                  )}
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-full p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Modal Body: Split View (Details Pane + PDF Viewer) ── */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Side: Offer Key Metrics (320px) */}
            <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border p-5 overflow-y-auto space-y-4 bg-surface/50">
              <div className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">
                Offer Parameters
              </div>

              {loading ? (
                <div className="text-xs text-text-secondary py-8 text-center">
                  Loading metrics...
                </div>
              ) : offer ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-primary" /> Total Annual CTC
                    </span>
                    <p className="text-base font-bold text-text-primary">
                      {offer.salary || "Not Specified"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5 text-primary" /> Employment Type
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {offer.employment_type || "Full Time"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Joining Date
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {offer.joining_date || "To be confirmed"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                    <span className="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" /> Offer Expiry Deadline
                    </span>
                    <p className="text-sm font-medium text-text-primary">
                      {offer.offer_expiry || "Standard (5 days)"}
                    </p>
                  </div>

                  {offer.notes && (
                    <div className="rounded-xl border border-border bg-card p-3.5 space-y-1">
                      <span className="text-[11px] font-semibold text-text-secondary">
                        Internal Notes
                      </span>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {offer.notes}
                      </p>
                    </div>
                  )}

                  {onEdit && (
                    <button
                      onClick={() => {
                        onClose();
                        onEdit(offer);
                      }}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover transition cursor-pointer"
                    >
                      Edit Offer Values
                    </button>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right Side: Embedded High-Resolution PDF Viewer */}
            <div className="flex-1 bg-slate-900/5 dark:bg-black/40 p-3 overflow-hidden flex flex-col">
              {pdfLoading ? (
                <div className="flex-1 flex items-center justify-center text-sm text-text-secondary">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  Generating & loading offer letter document...
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="Offer Letter PDF Preview"
                  className="w-full h-full rounded-xl border border-border/80 bg-white shadow-inner"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-sm text-text-secondary p-8 text-center">
                  <FileText className="h-12 w-12 text-text-secondary/40 mb-3" />
                  <p className="font-semibold text-text-primary">
                    No offer letter document generated yet
                  </p>
                  <p className="text-xs mt-1">
                    Click &quot;Generate Offer&quot; to compile the official corporate PDF document.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
