"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";

interface ResumePreviewProps {
  candidate?: any;
}

export default function ResumePreview({ candidate }: ResumePreviewProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let activeBlob: string | null = null;
    if (candidate?.id && candidate?.resume_path) {
      setLoading(true);
      api.get(`/candidates/${candidate.id}/resume`, { responseType: "blob" })
        .then((res) => {
          const isDocx = (candidate.original_filename || candidate.resume_path || "").toLowerCase().endsWith(".docx");
          const mime = isDocx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
          const b = new Blob([res.data], { type: mime });
          const url = URL.createObjectURL(b);
          activeBlob = url;
          setBlobUrl(url);
        })
        .catch((err) => {
          console.error("Failed to load resume blob:", err);
          setBlobUrl(null);
        })
        .finally(() => setLoading(false));
    } else {
      setBlobUrl(null);
    }

    return () => {
      if (activeBlob) {
        URL.revokeObjectURL(activeBlob);
      }
    };
  }, [candidate?.id, candidate?.resume_path]);

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${candidate?.full_name || "Candidate"}_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (candidate?.id) {
      window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/candidates/${candidate.id}/resume`, "_blank");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 ">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold">Resume Preview</h3>
          <p className="text-sm text-muted">Embedded resume viewer.</p>
        </div>

        {candidate?.resume_path && (
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm hover:bg-secondary-surface transition cursor-pointer"
          >
            Download
          </button>
        )}
      </div>

      {/* Preview Area */}
      <div className="h-[420px] overflow-hidden rounded-2xl border border-border bg-card p-6 flex items-center justify-center">
        {loading ? (
          <div className="text-muted text-sm flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Loading resume preview...
          </div>
        ) : blobUrl ? (
          <iframe
            src={blobUrl}
            title="Resume Preview"
            className="h-full w-full rounded-xl border-none"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-border text-muted">
            No Resume Available
          </div>
        )}
      </div>
    </div>
  );
}