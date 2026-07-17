"use client";

import { useEffect, useState } from "react";
import CandidateProfilePage from "@/components/candidates/CandidateProfilePage";

export default function CandidateProfileRoute({
    params,
}: {
    params: { id: string };
}) {
    const [candidate, setCandidate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/candidates/${params.id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                const data = await response.json();

                setCandidate({
                    id: data.id,
                    // Identity
                    name: data.full_name || "Unknown Candidate",
                    title: data.company
                        ? `${data.experience ?? 0} yrs exp · ${data.company}`
                        : `${data.experience ?? 0} years experience`,
                    initials: data.full_name
                        ?.split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "??",

                    // Contact
                    contact: {
                        email: data.email || "Not available",
                        phone: data.phone || "Not available",
                        location: data.location || "Not available",
                        linkedin: "",
                    },

                    // Skills — stored as comma-separated string
                    skills: data.skills
                        ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
                        : [],

                    // Education — stored as plain text
                    education: data.education || "",

                    // Resume
                    resume_path: data.resume_path || "",
                    resumeUrl: data.resume_path
                        ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${data.resume_path}`
                        : null,

                    // Status / stage
                    stage: data.status || "Applied",

                    // AI summary placeholder (extend when backend supports it)
                    aiSummary: [
                        data.full_name && `${data.full_name} is a candidate`,
                        data.experience && `with ${data.experience} years of experience`,
                        data.company && `previously at ${data.company}`,
                        data.location && `based in ${data.location}`,
                        data.skills && `with skills in ${data.skills}`,
                    ]
                        .filter(Boolean)
                        .join(" ") + ".",

                    // Empty arrays — extend when backend supports these
                    experience: [],
                    activity: [],
                    interviews: [],
                    scheduledInterviews: [],
                    resumeVersions: [],
                    notes: [],
                    
                    experience_years: data.experience,

                    recruiter: "Recruiter",
                });
            } catch (error) {
                console.error("Failed to fetch candidate:", error);
            }
            setLoading(false);
        };

        fetchCandidate();
    }, [params.id]);

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0a0b0e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(160,166,184,0.7)",
                    fontFamily: "DM Sans, system-ui, sans-serif",
                    fontSize: "0.9rem",
                    gap: 10,
                }}
            >
                <div
                    style={{
                        width: 18,
                        height: 18,
                        border: "2px solid rgba(78,127,255,0.3)",
                        borderTopColor: "#4e7fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                    }}
                />
                Loading candidate…
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!candidate) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#0a0b0e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(160,166,184,0.7)",
                    fontFamily: "DM Sans, system-ui, sans-serif",
                }}
            >
                Candidate not found.
            </div>
        );
    }

    return <CandidateProfilePage candidate={candidate} />;
}