"use client";

import { Briefcase, MapPin, Star } from "lucide-react";

interface CandidateCardProps {
    name: string;
    role: string;
    experience: string;
    location: string;
    matchScore: number;
    skills: string[];
}

export default function CandidateCard({
    name,
    role,
    experience,
    location,
    matchScore,
    skills,
}: CandidateCardProps) {
    return (
        <div className="rounded-3xl bg-muted/30 p-6">

            {/* Top Section */}
            <div className="flex items-start justify-between gap-4">

                <div>
                    <h3 className="text-base font-semibold">
                        {name}
                    </h3>

                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span>{role}</span>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{location}</span>
                    </div>
                </div>

                {/* Match Score */}
                <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Star className="h-4 w-4 fill-primary" />
                    {matchScore}%
                </div>
            </div>

            {/* Experience */}
            <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                    Experience:{" "}
                    <span className="font-medium text-foreground">
                        {experience}
                    </span>
                </p>
            </div>

            {/* Skills */}
            <div className="mt-4 flex flex-wrap gap-2">

                {(skills || []).map((skill, index) => (
                    <span
                        key={index}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                        {skill}
                    </span>
                ))}

            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-3">

                <button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                    View Profile
                </button>

                <button className="rounded-xl border px-4 py-2 text-sm font-medium transition hover:bg-muted">
                    Shortlist
                </button>

            </div>
        </div>
    );
}