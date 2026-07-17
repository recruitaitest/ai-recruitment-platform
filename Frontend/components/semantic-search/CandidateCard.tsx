"use client";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { useSemanticSearchStore } from "@/store/semanticSearchStore";
import ShortlistModal from "./ShortlistModal";
import { useState } from "react";
import MatchScoreBadge from "./MatchScoreBadge";
import SkillTags from "./SkillTags";
import { useRouter } from "next/navigation";
import { Candidate } from "@/types/Candidate";
import { getCandidateById } from "@/services/candidateService";

interface CandidateCardProps {
    candidate: Candidate;
    showMatchScore?: boolean;
    searchType?: "standard" | "advanced" | "jd" | "position";
}

export default function CandidateCard({
    candidate,
    showMatchScore = false,
    searchType = "standard",
}: CandidateCardProps) {
    const { setSelectedCandidate, setDrawerOpen } = useSemanticSearchStore();
    const router = useRouter();
    const [shortlistOpen, setShortlistOpen] = useState(false);

    const candidateSkills =
        candidate.skills
            ?.split(",")
            .map((skill) => skill.trim())
            .filter(Boolean) || [];

    const hasBreakdown =
        candidate.semantic_score != null ||
        candidate.skills_score != null ||
        candidate.experience_score != null;

    const matchScore = candidate.match_score ?? 0;

    const barColor =
        matchScore > 80 ? "bg-green-400" :
            matchScore > 60 ? "bg-yellow-400" :
                "bg-red-400";

    const totalScoreColor =
        matchScore > 80 ? "text-green-500" :
            matchScore > 60 ? "text-yellow-500" :
                "text-red-500";

    return (
        <>
            <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-md">

                {/* Top Section */}
                <div className="flex items-start justify-between gap-4">

                    {/* Candidate Info */}
                    <div className="flex gap-4">

                        {/* Avatar */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-semibold text-blue-700">
                            {(candidate.candidate_name || candidate.full_name || "NA")
                                .split(" ")
                                .map((word) => word[0])
                                .join("")}
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold">
                                {candidate.candidate_name || candidate.full_name || "Unknown Candidate"}
                            </h3>

                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">

                                <div className="flex items-center gap-1">
                                    <Briefcase className="h-4 w-4" />
                                    {candidate.status || "Applied"}
                                </div>

                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {candidate.location || "N/A"}
                                </div>

                                {(searchType === "jd" ||
                                    searchType === "position" ||
                                    searchType === "advanced") &&
                                    candidate.experience != null && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {candidate.experience}{" "}
                                            {candidate.experience === 1 ? "yr" : "yrs"}
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* Match Score Badge */}
                    {(showMatchScore || searchType === "advanced") && (
                        <MatchScoreBadge 
                            score={matchScore}
                            showBreakdown={hasBreakdown}
                            breakdown={hasBreakdown ? {
                                ai_score: candidate.ai_score,
                                skills: candidate.skills_score,
                                experience: candidate.experience_score
                            } : undefined}
                        />
                    )}
                </div>



                {/* ── STANDARD ── */}
                {searchType === "standard" && (
                    <>
                        {(candidate.matched_keywords?.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-green-500">
                                    Matched Keywords
                                </p>
                                <SkillTags skills={candidate.matched_keywords ?? []} />
                            </div>
                        )}
                        {candidateSkills.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-blue-500">
                                    Candidate Skills
                                </p>
                                <SkillTags skills={candidateSkills} />
                            </div>
                        )}
                    </>
                )}

                {/* ── ADVANCED ── */}
                {searchType === "advanced" && (
                    <>
                        {(candidate.matched_skills?.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-green-500">
                                    Matched Skills
                                </p>
                                <SkillTags skills={candidate.matched_skills ?? []} />
                            </div>
                        )}
                        {(candidate.missing_skills?.length ?? 0) > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-medium text-red-500">
                                    Missing Skills
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.missing_skills?.map((skill) => (
                                        <span
                                            key={skill}
                                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {candidateSkills.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-blue-500">
                                    Candidate Skills
                                </p>
                                <SkillTags skills={candidateSkills} />
                            </div>
                        )}
                    </>
                )}

                {/* ── JD ── */}
                {searchType === "jd" && (
                    <>
                        {(candidate.matched_skills?.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-green-500">
                                    Matched Skills
                                </p>
                                <SkillTags skills={candidate.matched_skills ?? []} />
                            </div>
                        )}
                        {(candidate.missing_skills?.length ?? 0) > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-medium text-red-500">
                                    Missing Skills
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.missing_skills?.map((skill) => (
                                        <span
                                            key={skill}
                                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {candidateSkills.length > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-blue-500">
                                    Candidate Skills
                                </p>
                                <SkillTags skills={candidateSkills} />
                            </div>
                        )}
                    </>
                )}

                {/* ── POSITION ── */}
                {searchType === "position" && (
                    <>
                        {(candidate.matched_skills?.length ?? 0) > 0 && (
                            <div className="mt-5">
                                <p className="mb-2 text-xs font-medium text-green-500">
                                    Matched Skills
                                </p>
                                <SkillTags skills={candidate.matched_skills ?? []} />
                            </div>
                        )}
                        {(candidate.missing_skills?.length ?? 0) > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-medium text-red-500">
                                    Missing Skills
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {candidate.missing_skills?.map((skill) => (
                                        <span
                                            key={skill}
                                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Bottom Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            if (!candidate.candidate_id) return;
                            router.push(`/candidates/${candidate.candidate_id}`);
                        }}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        View Profile
                    </button>

                    <button
                        onClick={async () => {
                            try {
                                if (!candidate.candidate_id) return;
                                const fullCandidate = await getCandidateById(candidate.candidate_id);
                                setSelectedCandidate(fullCandidate);
                                setDrawerOpen(true);
                            } catch (error) {
                                console.error(error);
                            }
                        }}
                        className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        Quick Preview
                    </button>

                    <button
                        onClick={() => setShortlistOpen(true)}
                        className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                    >
                        Shortlist
                    </button>
                </div>
            </div>

            <ShortlistModal
                open={shortlistOpen}
                onClose={() => setShortlistOpen(false)}
                candidateId={
                    candidate.candidate_id ??
                    candidate.id
                }
                candidateName={
                    candidate.candidate_name ||
                    candidate.full_name ||
                    ""
                }
            />
        </>
    );
}