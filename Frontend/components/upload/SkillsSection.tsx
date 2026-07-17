interface SkillsSectionProps {
    candidate?: any;
}

export default function SkillsSection({
    candidate,
}: SkillsSectionProps) {

    const skills = Array.isArray(candidate?.skills)
        ? candidate.skills
        : typeof candidate?.skills === "string"
            ? candidate.skills
                .split(",")
                .map((skill: string) => skill.trim())
                .filter(Boolean)
            : [];
    return (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6">

            <h3 className="text-xl font-semibold">
                Extracted Skills
            </h3>

            <p className="text-sm text-slate-400 mt-1">
                AI-detected candidate skills and technologies.
            </p>

            {!skills.length ? (
                <p className="text-slate-400 mt-4">
                    No skills found
                </p>
            ) : (
                <div className="flex flex-wrap gap-3 mt-5">

                    {skills.map((skill: string) => (
                        <span
                            key={skill}
                            className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300"
                        >
                            {skill}
                        </span>
                    ))}

                </div>
            )}

        </div>
    );
}