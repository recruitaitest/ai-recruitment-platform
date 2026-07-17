"use client";

const SKILL_COLORS = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-teal-50 text-teal-700 border-teal-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-rose-50 text-rose-600 border-rose-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-sky-50 text-sky-700 border-sky-200",
    "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-orange-50 text-orange-700 border-orange-200",
];

const colorCache: Record<string, string> = {};
let colorIndex = 0;

function getSkillColor(skill: string): string {
    if (!colorCache[skill]) {
        colorCache[skill] = SKILL_COLORS[colorIndex % SKILL_COLORS.length];
        colorIndex++;
    }
    return colorCache[skill];
}

export function SkillTag({
    skill,
    onClick,
    active,
}: {
    skill: string;
    onClick?: () => void;
    active?: boolean;
}) {
    const color = getSkillColor(skill);
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-all ${active
                    ? "ring-2 ring-offset-1 ring-current scale-105"
                    : "hover:scale-105"
                } ${color} ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
            {skill}
        </button>
    );
}

export function SkillList({
    skills,
    max = 3,
}: {
    skills: string[];
    max?: number;
}) {
    const visible = skills.slice(0, max);
    const rest = skills.length - max;
    return (
        <div className="flex flex-wrap gap-1">
            {visible.map((s) => (
                <SkillTag key={s} skill={s} />
            ))}
            {rest > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                    +{rest}
                </span>
            )}
        </div>
    );
}