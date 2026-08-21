"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  CheckCircle2,
  Sparkles,
  X,
  Download,
  Loader2,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  getOfferTemplateInfo,
  uploadOfferTemplate,
  deleteOfferTemplate,
} from "@/services/offerService";

export default function OfferTemplateSection() {
  const [templateInfo, setTemplateInfo] = useState<{
    has_template: boolean;
    filename: string | null;
    file_size: number;
    uploaded_at: string | null;
  }>({
    has_template: false,
    filename: null,
    file_size: 0,
    uploaded_at: null,
  });

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const data = await getOfferTemplateInfo();
      setTemplateInfo(data);
    } catch (err) {
      console.error("Failed to load offer template info:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a valid PDF file.");
      return;
    }

    try {
      setUploading(true);
      await uploadOfferTemplate(file);
      toast.success(`Template "${file.name}" uploaded successfully!`);
      await fetchTemplate();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to upload offer template.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      await deleteOfferTemplate();
      toast.success("Offer template removed. Default corporate AI template will be used.");
      await fetchTemplate();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove template.");
    } finally {
      setUploading(false);
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const templateUrl = `${baseUrl}/offers/template/file`;

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-border/60 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/40 dark:from-surface/80 dark:via-surface dark:to-surface/80 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            {templateInfo.has_template ? (
              <FileCheck className="h-5 w-5 text-emerald-500" />
            ) : (
              <Sparkles className="h-5 w-5 text-primary" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Corporate Offer Letter Template
              </h3>
              {templateInfo.has_template ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Custom Template Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-primary border border-primary/20">
                  Default AI Corporate Template
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              {templateInfo.has_template
                ? `Active File: "${templateInfo.filename}" (Uploaded ${templateInfo.uploaded_at || "recently"}). All newly generated offer letters will follow this template structure.`
                : "Upload your company's official offer letter PDF template to enforce custom corporate clauses, letterhead, and compensation layout."}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!templateInfo.has_template ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] transition disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  Upload Template PDF
                </>
              )}
            </button>
          ) : (
            <>
              {/* Preview Button */}
              <button
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-surface-hover active:scale-[0.98] transition"
              >
                <Eye className="h-4 w-4 text-primary" />
                Preview Template
              </button>

              {/* Remove Button */}
              <button
                onClick={handleRemove}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 active:scale-[0.98] transition"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Template Preview Modal ── */}
      <AnimatePresence>
        {previewOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-hover/30">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Offer Letter Template Preview
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {templateInfo.filename || "offer_template.pdf"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={templateUrl}
                    download={templateInfo.filename || "offer_template.pdf"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>

                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="rounded-xl p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Embedded PDF Iframe */}
              <div className="flex-1 w-full bg-slate-900/5 dark:bg-black/30 p-2 overflow-hidden">
                <iframe
                  src={templateUrl}
                  title="Offer Template Preview"
                  className="w-full h-full rounded-xl border border-border/60 bg-white"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
