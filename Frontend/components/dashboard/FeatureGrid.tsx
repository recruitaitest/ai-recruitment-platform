'use client'

import { motion } from 'framer-motion'

interface Feature {
  title: string
  description: string
  icon?: React.ReactNode
  onClick?: () => void
  badge?: string
}

interface FeatureGridProps {
  features: Feature[]
  columns?: 1 | 2 | 3 | 4
  containerVariants?: any
  itemVariants?: any
}

export function FeatureGrid({
  features,
  columns = 2,
  containerVariants,
  itemVariants,
}: FeatureGridProps) {
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const container = containerVariants || defaultContainerVariants
  const item = itemVariants || defaultItemVariants

  const colsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }

  return (
    <motion.div
      className={`grid grid-cols-1 ${colsClass[columns]} gap-4 mb-6`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {features.map((feature, index) => (
        <motion.div
          key={index}
          variants={item}
          onClick={feature.onClick}
          className={`glass-bg-dark p-6 rounded-xl transition-all duration-300 group ${
            feature.onClick ? 'hover:bg-white/20 cursor-pointer' : ''
          }`}
        >
          {feature.badge && (
            <div className="mb-3 inline-block">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {feature.badge}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </div>
            {feature.icon && (
              <div className="ml-3 text-blue-400 opacity-60 flex-shrink-0">
                {feature.icon}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
