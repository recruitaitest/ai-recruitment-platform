"use client";

function getSkillColor(skill: string): string {
 return "bg-surface-hover text-text-secondary border-border hover:text-primary hover:border-primary/30";
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
 className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border transition-all duration-base ease-standard ${active
 ? "ring-2 ring-offset-1 ring-current scale-[1.02]"
 : "hover:scale-[1.02] active:scale-95"
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
  skills?: string[] | string | null;
  max?: number;
}) {
  const list = Array.isArray(skills)
    ? skills
    : typeof skills === "string"
    ? skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const visible = list.slice(0, max);
  const rest = list.length - max;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((s) => (
        <SkillTag key={s} skill={s} />
      ))}
      {rest > 0 && (
 <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-muted border border-border">
 +{rest}
 </span>
 )}
 </div>
 );
}