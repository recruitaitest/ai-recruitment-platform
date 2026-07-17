'use client'

import { motion } from 'framer-motion'
import { MessageCircle, User, Clock, Heart } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'comment' | 'like' | 'update' | 'application'
  user: string
  action: string
  target: string
  timestamp: string
  avatar?: string
}

interface RecruiterActivityFeedProps {
  activities?: ActivityItem[]
  itemVariants?: any
}

export function RecruiterActivityFeed({
  activities,
  itemVariants,
}: RecruiterActivityFeedProps) {
  const defaultActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'update',
      user: 'Sarah Johnson',
      action: 'moved to',
      target: 'Interview stage',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      type: 'application',
      user: 'New Applicant',
      action: 'applied for',
      target: 'Senior Developer position',
      timestamp: '4 hours ago',
    },
    {
      id: '3',
      type: 'comment',
      user: 'Alex Chen',
      action: 'commented on',
      target: 'Emma Williams profile',
      timestamp: '6 hours ago',
    },
    {
      id: '4',
      type: 'like',
      user: 'Lisa Park',
      action: 'liked',
      target: 'Michael Chen resume',
      timestamp: '1 day ago',
    },
    {
      id: '5',
      type: 'update',
      user: 'Tom Wilson',
      action: 'rejected',
      target: 'David Martinez',
      timestamp: '2 days ago',
    },
  ]

  const data = activities || defaultActivities

  const defaultItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const item = itemVariants || defaultItemVariants

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'like':
        return <Heart className="w-5 h-5 text-red-400 fill-red-400" />
      case 'application':
        return <User className="w-5 h-5 text-green-400" />
      case 'update':
        return <Clock className="w-5 h-5 text-amber-400" />
      default:
        return <MessageCircle className="w-5 h-5 text-white/40" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-500/10 border-blue-500/30'
      case 'like':
        return 'bg-red-500/10 border-red-500/30'
      case 'application':
        return 'bg-green-500/10 border-green-500/30'
      case 'update':
        return 'bg-amber-500/10 border-amber-500/30'
      default:
        return 'bg-white/5 border-white/10'
    }
  }

  return (
    <motion.div
      variants={item}
      className="glass-bg-dark p-6 rounded-xl border border-white/10"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>

      <div className="space-y-3">
        {data.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-3 rounded-lg border ${getActivityColor(activity.type)} hover:bg-white/10 transition-colors cursor-pointer flex items-start gap-3 group`}
          >
            <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">
                <span className="font-medium">{activity.user}</span>
                <span className="text-white/60"> {activity.action} </span>
                <span className="font-medium text-blue-400">{activity.target}</span>
              </p>
              <p className="text-xs text-white/50 mt-1">{activity.timestamp}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
