'use client'

import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonLoaderProps {
  type: 'card' | 'table' | 'chart' | 'list'
  count?: number
}

function CardSkeleton() {
  return (
    <div className="glass-bg-dark p-6 rounded-xl border border-white/10 space-y-4">
      <Skeleton className="h-6 w-32 bg-white/10" />
      <Skeleton className="h-10 w-full bg-white/10" />
      <Skeleton className="h-10 w-full bg-white/10" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-8 bg-white/10" />
        <Skeleton className="h-8 bg-white/10" />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="glass-bg-dark p-6 rounded-xl border border-white/10 space-y-4">
      <Skeleton className="h-6 w-40 bg-white/10" />
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-48 bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="glass-bg-dark p-6 rounded-xl border border-white/10 space-y-4">
      <Skeleton className="h-6 w-40 bg-white/10" />
      <Skeleton className="h-64 w-full bg-white/10 rounded-lg" />
      <div className="grid grid-cols-5 gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 bg-white/10" />
        ))}
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="glass-bg-dark p-6 rounded-xl border border-white/10 space-y-3">
      <Skeleton className="h-6 w-40 bg-white/10" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
          <Skeleton className="h-4 w-48 bg-white/10" />
          <Skeleton className="h-3 w-full bg-white/10" />
          <Skeleton className="h-3 w-32 bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonLoader({ type, count = 1 }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return <CardSkeleton />
      case 'table':
        return <TableSkeleton />
      case 'chart':
        return <ChartSkeleton />
      case 'list':
        return <ListSkeleton />
      default:
        return <CardSkeleton />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {renderSkeleton()}
        </motion.div>
      ))}
    </motion.div>
  )
}
