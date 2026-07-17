'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, User, MapPin } from 'lucide-react'

interface Interview {
  id: string
  candidateName: string
  position: string
  date: string
  time: string
  interviewer: string
  location: string
  type: 'video' | 'phone' | 'in-person'
}

interface UpcomingInterviewsProps {
  interviews?: Interview[]
  itemVariants?: any
}

export function UpcomingInterviews({
  interviews,
  itemVariants,
}: UpcomingInterviewsProps) {
  

  const data = interviews || []

  const defaultItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const item = itemVariants || defaultItemVariants

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥'
      case 'phone':
        return '📞'
      case 'in-person':
        return '👤'
      default:
        return '📅'
    }
  }

  return (
    <motion.div
      variants={item}
      className="glass-bg-dark p-6 rounded-xl border border-white/10 bg-slate-900/80"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Upcoming Interviews</h3>

      <div className="space-y-4">
        {data.map((interview, index) => (
          <motion.div
            key={interview.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">{getTypeIcon(interview.type)}</div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white mb-2">{interview.candidateName}</h4>
                <p className="text-sm text-white/60 mb-3">{interview.position}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>{interview.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{interview.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>{interview.interviewer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{interview.location}</span>
                  </div>
                </div>
              </div>

              {interview.type === 'video' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = interview.location?.startsWith('http') ? interview.location : 'https://meet.google.com/new';
                    window.open(link, '_blank');
                  }}
                  className="px-3 py-1 text-sm font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors whitespace-nowrap mt-2"
                >
                  Join
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
