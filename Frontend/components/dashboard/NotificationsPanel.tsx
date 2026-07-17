'use client'

import { motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface NotificationItem {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  type?: 'info' | 'warning' | 'success' | 'error'
  action?: {
    label: string
    onClick?: () => void
  }
}

interface NotificationsPanelProps {
  notifications: NotificationItem[]
  onDismiss?: (id: string) => void
  onMarkAsRead?: (id: string) => void
  showBadge?: boolean
  itemVariants?: any
}

export function NotificationsPanel({
  notifications,
  onDismiss,
  onMarkAsRead,
  showBadge = true,
  itemVariants,
}: NotificationsPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const defaultItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  const item = itemVariants || defaultItemVariants
  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={panelRef}>
      {/* Notification Bell Button styled exactly like the Admin Portal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <Bell className="h-4 w-4 text-slate-500 dark:text-slate-100" />
        {showBadge && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown styled exactly like the Admin Portal */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute right-0 mt-2 z-50 w-96 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 p-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-100 dark:text-slate-100">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-slate-500 dark:text-slate-400 text-center">No notifications</div>
            ) : (
              notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  variants={item}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  className={`cursor-pointer border-b border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-start justify-between gap-3 ${
                    !notification.read ? 'bg-slate-50/50 dark:bg-slate-800/40' : ''
                  }`}
                  onClick={() => onMarkAsRead?.(notification.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-100 dark:text-slate-100 truncate">
                        {notification.title}
                      </h4>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                      {notification.description}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {notification.timestamp}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDismiss?.(notification.id)
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
