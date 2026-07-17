"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { isAuthenticated }
    from "@/lib/auth";

import UploadDropzone from "@/components/upload/UploadDropzone";

import UploadProgress from "@/components/upload/UploadProgress";

import UploadedFiles from "@/components/upload/UploadedFiles";

import CandidateInfo from "@/components/upload/CandidateInfo";

import SkillsSection from "@/components/upload/SkillsSection";

import ExperienceSection from "@/components/upload/ExperienceSection";

import EducationSection from "@/components/upload/EducationSection";

import AISummaryCard from "@/components/upload/AISummaryCard";

import MatchScoreCard from "@/components/upload/MatchScoreCard";

import ResumePreview from "@/components/upload/ResumePreview";

import { AppLayout } from "@/components/AppLayout";
import { candidates } from "@/data/mockInterviews";

export default function ResumeUploadPage() {

    const router = useRouter();
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [uploadedCandidates, setUploadedCandidates] =
        useState<any[]>([]);
    useEffect(() => {

        if (!isAuthenticated()) {

            router.push("/login");
        }

    }, []);

    const [uploadInfo, setUploadInfo] = useState({
        fileName: "",
        fileSize: "",
        progress: 0,
        status: "Waiting"
    });


    return (
        <AppLayout>
            <div className="min-h-screen bg-[#050816] text-white p-6">

                {/* Header */}

                <div className="mb-6 flex items-center justify-between">

                    <div>

                        <h1 className="text-3xl font-bold tracking-tight">

                            Resume Upload

                        </h1>

                        <p className="text-sm text-slate-400 mt-1">

                            Upload resumes and extract AI-powered candidate insights instantly.

                        </p>

                    </div>

                    <div className="flex gap-3">

                        <button className="rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2 text-sm hover:bg-slate-800 transition">

                            Recent Uploads

                        </button>

                        <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition">

                            Upload Guidelines

                        </button>

                    </div>

                </div>

                {/* Main Layout */}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* LEFT SIDE */}

                    <div className="space-y-6">

                        <UploadDropzone
                            onUploadChange={setUploadInfo}
                            onSuccess={(candidate) => {

                                setSelectedCandidate(candidate);

                                setUploadedCandidates((prev) => [
                                    candidate,
                                    ...prev
                                ]);

                            }}
                        />
                        <UploadProgress uploadInfo={uploadInfo} />

                        <UploadedFiles
                            candidates={uploadedCandidates}
                            selectedCandidate={selectedCandidate}
                            onSelectCandidate={setSelectedCandidate}
                        />

                    </div>

                    {/* RIGHT SIDE */}

                    <div className="space-y-6">

                        <CandidateInfo candidate={selectedCandidate} />

                        <SkillsSection candidate={selectedCandidate} />

                        <ExperienceSection candidate={selectedCandidate} />

                        <EducationSection candidate={selectedCandidate} />


                        {/* AI Cards */}

                        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

                            <AISummaryCard candidate={selectedCandidate} />

                        </div>

                        <ResumePreview candidate={selectedCandidate} />

                    </div>

                </div>

            </div>
        </AppLayout>
    );
}
