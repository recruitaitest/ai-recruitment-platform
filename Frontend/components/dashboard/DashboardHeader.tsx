'use client'

import { motion } from 'framer-motion'
import { User, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface DashboardHeaderProps {
  userEmail: string
  containerVariants?: any
  itemVariants?: any
}

export function DashboardHeader({
  userEmail,
  containerVariants,
  itemVariants,
}: DashboardHeaderProps) {
  const [platformName, setPlatformName] = useState('RecruitAI')

  useEffect(() => {
    const fetchPlatformName = async () => {
      try {
        const res = await api.get('/admin/settings/public')
        if (res.data && res.data.platform_name) {
          setPlatformName(res.data.platform_name)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchPlatformName()
  }, [])

  const defaultContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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

  return (
    <motion.div
      variants={item}
      className="glass-bg-dark p-8 rounded-2xl mb-6"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to {platformName}
          </h1>
          <p className="text-white/70">
            Your AI-powered recruitment dashboard
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <User className="h-8 w-8 text-white" />
          </div>
        </motion.div>
      </div>

      <motion.div
        variants={item}
        className="p-4 bg-white/5 rounded-lg border border-white/10"
      >
        <div className="flex items-center gap-3 text-white/70 mb-2">
          <Mail size={18} />
          <span className="text-sm">Logged in as</span>
        </div>
        <p className="text-white font-medium">{userEmail}</p>
      </motion.div>
    </motion.div>
  )
}
