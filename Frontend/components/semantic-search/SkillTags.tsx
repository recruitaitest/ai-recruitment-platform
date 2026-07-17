interface SkillTagsProps {
    skills: string[];
}

export default function SkillTags({
    skills = [],
}: SkillTagsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
                <span
                    key={skill}
                    className="rounded-full bg-muted px-3 py-1 text-xs font-medium"
                >
                    {skill}
                </span>
            ))}
        </div>
    );
}