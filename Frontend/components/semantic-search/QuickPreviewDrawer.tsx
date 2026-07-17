"use client";

import {
    Briefcase,
    Mail,
    MapPin,
    Phone,
    X,
} from "lucide-react";

import SkillTags from "./SkillTags";

import { useSemanticSearchStore } from "@/store/semanticSearchStore";

export default function QuickPreviewDrawer() {

    const {
        selectedCandidate,
        drawerOpen,
        setDrawerOpen,
    } = useSemanticSearchStore();

    // No candidate selected
    if (!selectedCandidate) {
        return null;
    }

    return (
        <>
            {/* Overlay */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 z-50 h-screen w-full max-w-md overflow-hidden transform border-l border-slate-700 bg-slate-950 shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-transform duration-300 ${drawerOpen
                    ? "translate-x-0"
                    : "translate-x-full"
                    }`}
            >

                {/* Header */}
                <div className="flex items-center justify-between border-b p-5">

                    <div>
                        <h2 className="text-lg font-semibold">
                            Candidate Preview
                        </h2>

                        <p className="text-sm text-muted-foreground">
                            AI-generated profile snapshot
                        </p>
                    </div>

                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="rounded-lg p-2 transition hover:bg-muted"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="h-[calc(100vh-90px)] space-y-6 overflow-y-auto p-5">

                    {/* Profile */}
                    <div className="flex items-center gap-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4">

                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                            {(
                                selectedCandidate.full_name ||
                                selectedCandidate.candidate_name ||
                                "Unknown Candidate"
                            )
                                .split(" ")
                                .map((word) => word[0])
                                .join("")}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">
                                {selectedCandidate.candidate_name}
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                {selectedCandidate.status || "Applied"}
                            </p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 text-sm">

                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            {selectedCandidate.email || "N/A"}
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {selectedCandidate.phone || "N/A"}
                        </div>

                        <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {selectedCandidate.location || "N/A"}
                        </div>

                        <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {selectedCandidate.experience}
                        </div>
                    </div>

                    {/* AI Insights */}
                    <div className="rounded-2xl border bg-card p-4">

                        <h4 className="mb-3 text-sm font-semibold">
                            AI Match Insights
                        </h4>

                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                • Strong skill alignment with search query
                            </p>

                            <p>
                                • Relevant SaaS product experience
                            </p>

                            <p>
                                • Good technology stack compatibility
                            </p>

                            <p>
                                • High AI match score
                            </p>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">
                            Skills
                        </h4>

                        <SkillTags
                            skills={
                                selectedCandidate.skills
                                    ? selectedCandidate.skills
                                        .split(",")
                                        .map((skill) => skill.trim())
                                    : []
                            }
                        />
                    </div>
                    {/* Education */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold">
                            Education
                        </h4>

                        <p className="text-sm whitespace-pre-line text-muted-foreground">
                            {selectedCandidate.education || "Not Available"}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-4">

                        <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
                            View Full Profile
                        </button>

                        <button className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                            Download Resume
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}