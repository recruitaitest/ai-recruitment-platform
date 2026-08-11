"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/lib/auth";
import { parseResume, getCandidateById } from "@/services/candidateService";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormErrors = {
    file?: string;
};

type Candidate = {
    id: number;
    full_name: string;
    email: string;
    phone: string;
};

type Props = {
    onSuccess?: (candidate: Candidate) => void;
    onCancel?: () => void;
    onUploadChange?: (data: {
        fileName: string;
        fileSize: string;
        progress: number;
        status: string;
    }) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fileSizeMB = (file: File) => `${(file.size / 1024 / 1024).toFixed(2)} MB`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UploadDropzone({ onSuccess, onCancel, onUploadChange }: Props) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<FormErrors>({});
    const [submitError, setSubmitError] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    const validate = () => {
        const newErrors: FormErrors = {};

        if (!selectedFile) newErrors.file = "Please select a resume file.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // -----------------------------------------------------------------------
    // Reset
    // -----------------------------------------------------------------------

    const resetForm = () => {
        setSelectedFile(null);
        setErrors({});
        setSubmitError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const handleFileChange = (file: File) => {
        setSelectedFile(file);
        setSubmitError("");
        setErrors((prev) => ({ ...prev, file: "" }));
        onUploadChange?.({
            fileName: file.name,
            fileSize: fileSizeMB(file),
            progress: 0,
            status: "Selected",
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileChange(file);
    };

    const handleCancel = () => {
        resetForm();
        onCancel?.();
    };

    const handleConfirm = async () => {
        if (!validate()) return;

        try {
            setSubmitError("");
            setUploading(true);

            onUploadChange?.({
                fileName: selectedFile!.name,
                fileSize: fileSizeMB(selectedFile!),
                progress: 30,
                status: "Uploading",
            });

            if (!AuthService.isAuthenticated() || !AuthService.getToken()) {
                AuthService.logout();
                router.push("/login");
                throw new Error("Session expired. Please login again.");
            }

            onUploadChange?.({
                fileName: selectedFile!.name,
                fileSize: fileSizeMB(selectedFile!),
                progress: 60,
                status: "Parsing",
            });

            // ── BATCH ZIP ARCHIVE HANDLER (Feature 2.6) ───────────────────
            if (selectedFile!.name.toLowerCase().endsWith(".zip")) {
                onUploadChange?.({
                    fileName: selectedFile!.name,
                    fileSize: fileSizeMB(selectedFile!),
                    progress: 45,
                    status: "Extracting & Parsing Batch Resumes...",
                });

                const { uploadBulkZipResumes } = await import("@/services/automationService");
                const zipResult = await uploadBulkZipResumes(selectedFile!);

                onUploadChange?.({
                    fileName: selectedFile!.name,
                    fileSize: fileSizeMB(selectedFile!),
                    progress: 100,
                    status: "Completed Batch Upload",
                });

                toast.success(`🎉 Successfully batch parsed ${zipResult.successfully_parsed} resumes from ZIP!`, { duration: 6000 });

                if (zipResult.parsed_candidates && zipResult.parsed_candidates.length > 0) {
                    onSuccess?.(zipResult.parsed_candidates[0]);
                } else {
                    router.push("/candidates");
                }
                resetForm();
                return;
            }

            let candidate = await parseResume(selectedFile!);

            onUploadChange?.({
                fileName: selectedFile!.name,
                fileSize: fileSizeMB(selectedFile!),
                progress: 80,
                status: "Processing Background Task...",
            });

            // Poll the backend until status is no longer "Processing"
            // Max wait: 5 minutes (150 × 2s = 300s)
            let pollAttempts = 0;
            const MAX_POLL = 150;
            while (candidate.status === "Processing" && pollAttempts < MAX_POLL) {
                pollAttempts++;
                await new Promise((resolve) => setTimeout(resolve, 2000));

                try {
                    candidate = await getCandidateById(candidate.id);
                } catch (e: any) {
                    if (e?.response?.status === 404) {
                        // The background worker deletes the placeholder if it's a duplicate
                        onUploadChange?.({
                            fileName: selectedFile!.name,
                            fileSize: fileSizeMB(selectedFile!),
                            progress: 0,
                            status: "Duplicate",
                        });
                        toast.error("⚠️ Candidate already exists! Duplicate discarded.", {
                            duration: 5000,
                        });
                        return; // Exit without calling onSuccess
                    }
                    console.error("Error polling candidate status:", e);
                    break; // stop polling on other errors
                }
            }

            if (candidate.status === "Error Parsing") {
                throw new Error("Background parsing failed.");
            }

            // Guard: if still Processing after max polls, warn but don't block
            if (candidate.status === "Processing") {
                console.warn("Background task taking longer than expected.");
            }

            onUploadChange?.({
                fileName: selectedFile!.name,
                fileSize: fileSizeMB(selectedFile!),
                progress: 100,
                status: "Completed",
            });

            onSuccess?.(candidate);
            resetForm();
        } catch (error: unknown) {
            console.error(error);

            const message =
                error &&
                    typeof error === "object" &&
                    "response" in error &&
                    error.response &&
                    typeof error.response === "object" &&
                    "data" in error.response &&
                    error.response.data &&
                    typeof error.response.data === "object" &&
                    "detail" in error.response.data
                    ? String(error.response.data.detail)
                    : error instanceof Error
                        ? error.message
                        : "Failed to upload and parse resume";

            if (
                error &&
                typeof error === "object" &&
                "response" in error &&
                error.response &&
                typeof error.response === "object" &&
                "status" in error.response &&
                error.response.status === 401
            ) {
                AuthService.logout();
                router.push("/login");
            }

            setSubmitError(message);
            onUploadChange?.({
                fileName: selectedFile?.name || "",
                fileSize: selectedFile ? fileSizeMB(selectedFile) : "",
                progress: 0,
                status: "Failed",
            });
        } finally {
            setUploading(false);
        }
    };



    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.zip,application/zip,application/x-zip-compressed"
                hidden
                onChange={(e) => {
                    if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
            />

            <div className="relative z-10 flex flex-col gap-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">Add Candidate / Bulk Upload</h2>
                    <button
                        onClick={handleCancel}
                        className="rounded-lg border border-border bg-secondary-surface/50 px-4 py-1.5 text-sm text-muted hover:text-text-primary hover:bg-slate-700 transition"
                    >
                        ✕ Cancel
                    </button>
                </div>

                {/* AI parsing info banner */}
                <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <span className="text-primary text-lg">🤖</span>
                    <p className="text-xs text-muted">
                        <span className="text-primary font-medium">AI-powered parsing & Bulk ZIP Ingestion</span> — Upload single PDF/DOCX resumes or a <span className="font-semibold text-primary">.ZIP archive</span> to batch create candidate profiles.
                    </p>
                </div>

                {/* ── Upload Box ────────────────────────────────────────── */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDragging
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                        }`}
                >
                    <div className="mb-4 rounded-full bg-primary/10 p-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-8 w-8 text-primary"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 16.5V3m0 0-3.75 3.75M12 3l3.75 3.75M3 15v3.75A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V15"
                            />
                        </svg>
                    </div>

                    <h3 className="text-base font-semibold mb-1">
                        {selectedFile ? selectedFile.name : "Drag & Drop Resume"}
                    </h3>

                    <p className="text-muted text-sm max-w-sm mb-4">
                        {selectedFile
                            ? "File ready. Click Upload & Parse to extract candidate details."
                            : "Upload a PDF or DOCX resume. AI will extract candidate details automatically."}
                    </p>

                    {errors.file && (
                        <p className="text-xs text-red-400 mb-3">{errors.file}</p>
                    )}

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 transition"
                    >
                        Browse Files
                    </button>

                    <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-muted">
                        <span className="rounded-full border border-border px-3 py-1">PDF Supported</span>
                        <span className="rounded-full border border-border px-3 py-1">DOCX Supported</span>
                        <span className="rounded-full border border-border px-3 py-1">Max 10MB</span>
                    </div>
                </div>

                {/* Submit Error */}
                {submitError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {submitError}
                    </div>
                )}

                {/* ── Action Buttons ────────────────────────────────────── */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={handleConfirm}
                        disabled={uploading}
                        className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            "✓ Upload & Parse Resume"
                        )}
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={uploading}
                        className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-secondary hover:bg-secondary-surface hover:text-text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                </div>

            </div>
        </div>
    );
}