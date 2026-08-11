import { Globe, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Position } from "@/types/positon";

interface Props {
  positions: Position[];
  onSelect: (position: Position) => void;
  onViewApplicants?: (position: Position) => void;
  onTogglePublish?: (positionId: number, currentStatus: boolean) => void;
}

export default function PositionTable({
  positions,
  onSelect,
  onViewApplicants,
  onTogglePublish,
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

              {/* Applicants - Clicking opens PositionApplicantsModal */}
              <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onViewApplicants?.(position)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 px-3.5 py-1 text-xs font-bold text-blue-500 transition-all"
                  title="View and Compare Applicants for this Role"
                >
                  <Users className="w-3.5 h-3.5" />
                  {position.applicants} Applicants
                </button>
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
                <button
                  type="button"
                  onClick={() => onTogglePublish?.(position.id, !!position.is_published)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    position.is_published
                      ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/25"
                      : "bg-slate-500/15 text-slate-400 border-slate-500/30 hover:bg-slate-500/25"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  {position.is_published ? "Visible on Portal" : "Hidden from Portal"}
                </button>
              </td>

              {/* Skills */}
              <td className="px-6 py-5">
                <div className="flex flex-wrap gap-1.5">
                  {position.skills?.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="rounded bg-secondary-surface px-2 py-1 text-xs font-medium text-text-primary border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                  {(position.skills?.length || 0) > 3 && (
                    <span className="text-xs text-muted font-medium self-center">
                      +{(position.skills?.length || 0) - 3} more
                    </span>
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