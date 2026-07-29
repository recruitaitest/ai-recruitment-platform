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
  isLoading?: boolean
}

export function AIRecommendations({
  recommendations,
  itemVariants,
  isLoading = false,
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

  const data = recommendations && recommendations.length > 0 ? recommendations : defaultRecommendations

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
 return 'bg-ai-accent-soft text-ai-accent border-ai-accent/30'
 default:
 return 'bg-secondary-surface text-text-secondary'
 }
 }

 return (
    <motion.div
      variants={item}
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-surface border-border shadow-[0_0_15px_var(--ai-accent-soft)] p-6 rounded-xl border border-ai-accent/30 relative overflow-hidden transition-shadow duration-300 hover:shadow-elevated"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-ai-accent/10 to-transparent animate-pulse pointer-events-none" />
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-ai-accent/40 blur-xs"
            />
            <Lightbulb className="w-5 h-5 text-ai-accent relative z-10" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">AI Recommendations</h3>
        </div>
        
        {/* Typing Cursor Effect for Real-Time Computational AI Inference */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ai-accent/10 border border-ai-accent/30 text-[11px] text-ai-accent font-mono">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-ai-accent"
          />
          <span>{isLoading ? 'Generating Insights...' : 'AI Inference active'}</span>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
             {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary-surface border border-border animate-pulse h-28"></div>
             ))}
          </div>
        ) : data.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
            className="relative z-10 p-4 rounded-lg bg-secondary-surface border border-border transition-all duration-base ease-standard hover:bg-surface-hover hover:shadow-soft group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h4 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                  {rec.title}
                </h4>
                <p className="text-sm text-secondary">{rec.description}</p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border whitespace-nowrap flex-shrink-0 ${getPriorityColor(rec.priority)}`}
              >
                {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="w-4 h-4" />
                <span>{rec.impact}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-primary/20 text-primary border border-primary/30 transition-all duration-base ease-standard focus-ring hover:bg-primary/30"
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
