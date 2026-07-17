'use client'

import { motion } from 'framer-motion'

interface StatCard {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
}

interface StatsCardsProps {
  stats: StatCard[]
  containerVariants?: any
  itemVariants?: any
}

export function StatsCards({
  stats,
  containerVariants,
  itemVariants,
}: StatsCardsProps) {
  const defaultContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const defaultItemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const container = containerVariants || defaultContainerVariants
  const item = itemVariants || defaultItemVariants

  const getChangeColor = (type?: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-400'
      case 'negative':
        return 'text-red-400'
      default:
        return 'text-white/60'
    }
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          variants={item}
          className="glass-bg-dark p-6 rounded-xl hover:bg-white/20 transition-all duration-300"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            {stat.icon && (
              <div className="text-blue-400 opacity-60">{stat.icon}</div>
            )}
          </div>
          {stat.change && (
            <p className={`text-sm ${getChangeColor(stat.changeType)}`}>
              {stat.change}
            </p>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}
