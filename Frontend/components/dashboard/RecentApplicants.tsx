'use client'

import { motion } from 'framer-motion'
import router, { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

interface Applicant {
id: string
name: string
position: string
email: string
experience: string
rating: number
status: 'screening' | 'interview' | 'offer' | 'rejected'
appliedDate: string
}

interface RecentApplicantsProps {
applicants?: Applicant[]
itemVariants?: any
}

export function RecentApplicants({
applicants,
itemVariants,
}: RecentApplicantsProps) {

const data = applicants || []
const router = useRouter()
const defaultItemVariants = {
hidden: { opacity: 0, y: 20 },
visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
},
}

const item = itemVariants || defaultItemVariants

const getStatusColor = (status: string) => {
switch (status) {
    case 'interview':
    return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'offer':
    return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'screening':
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    case 'rejected':
    return 'bg-red-500/20 text-red-300 border border-red-500/30'
    default:
    return 'bg-white/10 text-white/70'
}
}

const getRatingColor = (rating: number) => {
if (rating >= 4.7) return 'text-green-400'
if (rating >= 4.5) return 'text-blue-400'
return 'text-amber-400'
}

return (
<motion.div
    variants={item}
    className="glass-bg-dark p-6 rounded-xl border border-white/10"
>
    <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-white">Recent Applicants</h3>
    <button onClick={() => router.push('candidates')} className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
        View All
        <ChevronRight className="w-4 h-4" />
    </button>
    </div>

    <div className="overflow-x-auto">
    <table className="w-full">
        <thead>
        <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Name</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Position</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Experience</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Rating</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Status</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-white/70">Applied</th>
        </tr>
        </thead>
        <tbody>
        {data.map((applicant) => (
            <motion.tr
            key={applicant.id}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
            >
            <td className="px-4 py-3">
                <div>
                <p className="text-sm font-medium text-white">{applicant.name}</p>
                <p className="text-xs text-white/50">{applicant.email}</p>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-white/70">{applicant.position}</td>
            <td className="px-4 py-3 text-sm text-white/70">{applicant.experience}</td>
            <td className="px-4 py-3">
                <span className={`text-sm font-semibold ${getRatingColor(applicant.rating)}`}>
                ★ {applicant.rating}
                </span>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(applicant.status)}`}>
                {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-white/60">{applicant.appliedDate}</td>
            </motion.tr>
        ))}
        </tbody>
    </table>
    </div>
</motion.div>
)
}
