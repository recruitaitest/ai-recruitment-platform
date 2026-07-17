"use client";

const availableSkills = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "PostgreSQL",
    "Docker",
    "AWS",
    "Python",
    "FastAPI",
    "Tailwind",
    "Figma",
    "UI/UX",
];

interface Props {
    selectedSkills: string[];
    setSelectedSkills: (
        skills: string[]
    ) => void;
}

export default function SkillSelector({
    selectedSkills,
    setSelectedSkills,
}: Props) {
    const toggleSkill = (skill: string) => {

        if (
            selectedSkills.includes(skill)
        ) {

            setSelectedSkills(
                (Array.isArray(selectedSkills)
                    ? selectedSkills
                    : []
                ).filter(
                    (item) => item !== skill
                )
            );

        } else {

            setSelectedSkills([
                ...selectedSkills,
                skill,
            ]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">

            {availableSkills.map((skill) => {

                const selected =
                    Array.isArray(selectedSkills) &&
                    selectedSkills.includes(skill);

                return (
                    <button
                        key={skill}
                        type="button"
                        onClick={() =>
                            toggleSkill(skill)
                        }
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${selected
                            ? "bg-violet-600 text-white"
                            : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                    >
                        {skill}
                    </button>
                );
            })}
        </div>
    );
}