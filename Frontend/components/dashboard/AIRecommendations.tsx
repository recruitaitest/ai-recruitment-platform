'use client'

import { motion } from 'framer-motion'
import { Lightbulb, TrendingUp, Target } from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  action: string
  impact: string
  priority: 'high' | 'medium' | 'low'
}

interface AIRecommendationsProps {
  recommendations?: Recommendation[]
  itemVariants?: any
}

export function AIRecommendations({
  recommendations,
  itemVariants,
}: AIRecommendationsProps) {
  const defaultRecommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Optimize Job Descriptions',
      description: 'Your recent job descriptions are 30% shorter than industry average, attracting fewer quality candidates.',
      action: 'Review & Update',
      impact: '+45% more qualified applicants',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Fast-Track Top Candidate',
      description: 'Sarah Johnson matches 95% of requirements for Senior Developer role. Consider prioritizing her interview.',
      action: 'Schedule Interview',
      impact: 'Reduce time-to-hire by 5 days',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Reduce Screening Time',
      description: 'Implement AI-powered resume screening to reduce manual review time by 60%.',
      action: 'Enable AI Screening',
      impact: 'Save 20+ hours/week',
      priority: 'medium',
    },
  ]

  const data = recommendations || defaultRecommendations

  const defaultItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const item = itemVariants || defaultItemVariants

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-white/10 text-white/70'
    }
  }

  return (
    <motion.div
      variants={item}
      className="glass-bg-dark p-6 rounded-xl border border-white/10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
      </div>

      <div className="space-y-3">
        {data.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-semibold text-white mb-1 group-hover:text-blue-300 transition-colors">
                  {rec.title}
                </h4>
                <p className="text-sm text-white/60">{rec.description}</p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${getPriorityColor(rec.priority)}`}
              >
                {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1 text-xs text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>{rec.impact}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
              >
                {rec.action}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
