import { Globe, Users, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Position } from "@/types/positon";

interface Props {
  positions: Position[];
  onSelect: (position: Position) => void;
  onViewApplicants?: (position: Position) => void;
  onTogglePublish?: (positionId: number, currentStatus: boolean) => void;
  onViewSkills?: (position: Position) => void;
}

export default function PositionTable({
  positions,
  onSelect,
  onViewApplicants,
  onTogglePublish,
  onViewSkills,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-md">
      <table className="w-full min-w-[1200px]">
        <thead>
          <tr className="border-b border-border text-left text-sm text-muted">
            <th className="px-6 py-5 font-medium">Position</th>
            <th className="px-6 py-5 font-medium">Department</th>
            <th className="px-6 py-5 font-medium">Location</th>
            <th className="px-6 py-5 font-medium">Experience</th>
            <th className="px-6 py-5 font-medium">Applicants</th>
            <th className="px-6 py-5 font-medium">Status</th>
            <th className="px-6 py-5 font-medium">Career Portal</th>
            <th className="px-6 py-5 font-medium">Skills</th>
          </tr>
        </thead>

        <tbody>
          {positions.map((position) => (
            <motion.tr
              key={position.id}
              whileHover={{ y: -2, scale: 1.005 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => onSelect(position)}
              className="cursor-pointer border-b border-border transition-colors hover:bg-surface-hover/80"
            >
              {/* Position */}
              <td className="px-6 py-5">
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {position.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {position.type}
                  </p>
                </div>
              </td>

              {/* Department */}
              <td className="px-6 py-5 text-secondary">
                {position.department}
              </td>

              {/* Location */}
              <td className="px-6 py-5 text-secondary">
                {position.location}
              </td>

              {/* Experience */}
              <td className="px-6 py-5 text-secondary">
                {position.experience}
              </td>

              {/* Applicants Column */}
              <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-text-primary dark:text-white">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>{position.applicants}</span>
                    <span className="text-xs font-normal text-muted">
                      {position.applicants === 1 ? "applicant" : "applicants"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewApplicants?.(position)}
                    className="group inline-flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300 transition-all cursor-pointer hover:underline"
                    title="View and Compare Applicants for this Role"
                  >
                    <span>Show applicants</span>
                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    position.status === "Open"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-red-600/20 text-red-400"
                  }`}
                >
                  {position.status}
                </span>
              </td>

              {/* Career Portal Visibility Toggle */}
              <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-start gap-1.5">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!position.is_published}
                      onChange={() => onTogglePublish?.(position.id, !!position.is_published)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500 shadow-2xs"></div>
                  </label>

                  <span className={`text-[11px] font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    position.is_published
                      ? "text-emerald-500 dark:text-emerald-400 font-semibold"
                      : "text-slate-400 dark:text-slate-500"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${position.is_published ? "bg-emerald-500 animate-pulse" : "bg-slate-400 dark:bg-slate-500"}`} />
                    {position.is_published ? "Visible on Portal" : "Hidden from Portal"}
                  </span>
                </div>
              </td>

              {/* Skills */}
              <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap gap-1.5 items-center max-w-[280px]">
                  {(!position.skills || position.skills.length === 0) && (
                    <span className="text-xs text-muted">—</span>
                  )}
                  {position.skills?.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="rounded bg-secondary-surface px-2 py-1 text-xs font-medium text-text-primary border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                  {(position.skills?.length || 0) > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewSkills?.(position);
                      }}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-bold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                      title={`Click to view all ${position.skills?.length} required skills`}
                    >
                      +{(position.skills?.length || 0) - 3} more
                    </button>
                  )}
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}