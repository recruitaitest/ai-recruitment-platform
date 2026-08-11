'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, FolderCheck, Calendar, Layers, BarChart3 } from 'lucide-react'

interface DailyTrend {
  date: string
  count: number
}

interface PositionStat {
  position_id: number
  position_title: string
  cv_count: number
}

interface FolderStat {
  folder: string
  position_title: string
  count: number
}

interface CVAnalyticsData {
  daily_trend: DailyTrend[]
  by_position: PositionStat[]
  by_folder: FolderStat[]
}

export default function CVAnalyticsWidget({ itemVariants }: { itemVariants: any }) {
  const [data, setData] = useState<CVAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCVAnalytics() {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${API}/dashboard/cv-stats`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to fetch CV analytics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCVAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="bg-card border border-border p-6 rounded-xl space-y-4 animate-pulse">
        <div className="h-5 bg-secondary-surface rounded w-1/3" />
        <div className="h-32 bg-secondary-surface rounded-lg" />
      </div>
    )
  }

  const maxDaily = data?.daily_trend ? Math.max(...data.daily_trend.map((d) => d.count), 1) : 1
  const maxPos = data?.by_position ? Math.max(...data.by_position.map((p) => p.cv_count), 1) : 1

  return (
    <motion.div
      variants={itemVariants}
      className="bg-card border border-border shadow-soft p-6 rounded-xl hover:shadow-elevated transition-all space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">CV Ingestion & Folder Routing Analytics</h3>
            <p className="text-xs text-secondary">Real-time daily CV reception & folder distribution metrics</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric 1: Total CVs Received Per Day */}
        <div className="bg-secondary-surface p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-secondary font-medium">
            <span className="flex items-center gap-1.5 text-text-primary">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Daily CVs Received
            </span>
            <span className="text-indigo-400 font-semibold">Last 7 Days</span>
          </div>

          <div className="h-28 flex items-end gap-2 pt-2">
            {data?.daily_trend.map((item, idx) => {
              const heightPercent = Math.max((item.count / maxDaily) * 100, 10)
              const dayName = new Date(item.date).toLocaleDateString('en-US', { weekday: 'narrow' })
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded border border-border transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {item.date}: {item.count} CVs
                  </div>
                  <div className="w-full bg-indigo-500/10 rounded-t-md flex items-end overflow-hidden h-20">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercent}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-cyan-500 rounded-t-md"
                    />
                  </div>
                  <span className="text-[10px] text-secondary font-medium">{dayName}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metric 2: Number of CVs Received for Each Position */}
        <div className="bg-secondary-surface p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-secondary font-medium">
            <span className="flex items-center gap-1.5 text-text-primary">
              <FileText className="w-3.5 h-3.5 text-cyan-400" /> CVs per Position
            </span>
            <span className="text-cyan-400 font-semibold">{data?.by_position.length || 0} Positions</span>
          </div>

          <div className="space-y-2.5 max-h-32 overflow-y-auto pr-1">
            {data?.by_position.map((pos) => {
              const pct = (pos.cv_count / maxPos) * 100
              return (
                <div key={pos.position_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-primary truncate max-w-[150px] font-medium" title={pos.position_title}>
                      {pos.position_title}
                    </span>
                    <span className="text-cyan-400 font-bold text-[11px]">{pos.cv_count} CVs</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metric 3: Number of CVs Routed to Each Position Folder */}
        <div className="bg-secondary-surface p-4 rounded-xl border border-border space-y-3">
          <div className="flex items-center justify-between text-xs text-secondary font-medium">
            <span className="flex items-center gap-1.5 text-text-primary">
              <FolderCheck className="w-3.5 h-3.5 text-emerald-400" /> Position Folder Routing
            </span>
            <span className="text-emerald-400 font-semibold">Auto-Sorted</span>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {data?.by_folder.map((folder, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-background border border-border flex items-center justify-between text-xs">
                <div className="truncate max-w-[160px]">
                  <p className="text-text-primary font-medium truncate">{folder.position_title}</p>
                  <p className="text-[10px] text-muted truncate">{folder.folder}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  {folder.count} files
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
