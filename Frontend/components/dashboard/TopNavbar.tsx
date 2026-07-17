'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  LayoutGrid,
  Users,
  Sparkles,
  KanbanSquare,
  CalendarDays,
  Briefcase,
  BarChart3,
  Mail,
  Upload,
  Settings,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { globalSearch } from '@/services/globalSearchService'
import { hasAdminPortalAccess, hasRecruiterPortalAccess } from '@/utils/permissions'
import { applyTheme } from '@/utils/theme'
import { NotificationsPanel } from './NotificationsPanel'
import {
  getUserNotifications,
  deleteNotification,
  markNotificationRead,
} from '@/services/notificationCenterService'

interface TopNavbarProps {
  userEmail?: string
  onLogout?: () => void
  onSearch?: (query: string) => void
  itemVariants?: any
}

interface SearchItem {
  label: string
  href: string
  icon: React.ReactNode
  keywords: string[]
}

interface GlobalSearchResult {
  id: number | string
  type: 'candidate' | 'position' | 'pipeline' | 'interview' | string
  title: string
  subtitle?: string
}

interface NotificationItem {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
}

interface StoredUser {
  id?: number
  name?: string
  email?: string
  profile_photo?: string
}

export function TopNavbar({
  userEmail,
  onLogout,
  onSearch,
  itemVariants,
}: TopNavbarProps) {
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [currentRole, setCurrentRole] = useState('Recruiter')
  const [isDark, setIsDark] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [user, setUser] = useState<StoredUser | null>(null)

  const defaultItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  const item = itemVariants || defaultItemVariants

  const searchItems: SearchItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutGrid className="h-4 w-4" />,
      keywords: ['dashboard', 'home', 'overview', 'stats'],
    },
    {
      label: 'Resume Upload',
      href: '/resume-upload',
      icon: <Upload className="h-4 w-4" />,
      keywords: ['resume', 'upload', 'cv', 'add candidate', 'parse'],
    },
    {
      label: 'Candidates',
      href: '/candidates',
      icon: <Users className="h-4 w-4" />,
      keywords: ['candidates', 'people', 'applicants', 'talent', 'profiles'],
    },
    {
      label: 'AI Search',
      href: '/semantic-search',
      icon: <Sparkles className="h-4 w-4" />,
      keywords: ['ai search', 'semantic', 'smart search', 'search candidates', 'find candidates'],
    },
    {
      label: 'Pipeline',
      href: '/pipeline',
      icon: <KanbanSquare className="h-4 w-4" />,
      keywords: ['pipeline', 'kanban', 'board', 'stages', 'workflow', 'hiring pipeline'],
    },
    {
      label: 'Interviews',
      href: '/interviews',
      icon: <CalendarDays className="h-4 w-4" />,
      keywords: ['interviews', 'schedule', 'calendar', 'meetings'],
    },
    {
      label: 'Positions',
      href: '/positions',
      icon: <Briefcase className="h-4 w-4" />,
      keywords: ['positions', 'jobs', 'openings', 'roles', 'vacancies'],
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      keywords: ['analytics', 'reports', 'charts', 'data', 'metrics', 'statistics'],
    },
    {
      label: 'Mailbox',
      href: '/mailbox',
      icon: <Mail className="h-4 w-4" />,
      keywords: ['mailbox', 'email', 'inbox', 'messages', 'communication'],
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      keywords: ['settings', 'preferences', 'profile', 'account', 'configuration'],
    },
  ]

  const filteredSearchItems = searchQuery.trim()
    ? searchItems.filter((entry) => {
        const q = searchQuery.toLowerCase()
        return (
          entry.label.toLowerCase().includes(q) ||
          entry.keywords.some((kw) => kw.toLowerCase().includes(q))
        )
      })
    : []

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setLoading(false)
      return
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true)
        const results = await globalSearch(searchQuery)
        setSearchResults(Array.isArray(results) ? results : [])
      } catch (error) {
        console.error(error)
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))

    const handleThemeChange = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }

    window.addEventListener('theme-changed', handleThemeChange)
    return () => window.removeEventListener('theme-changed', handleThemeChange)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const portal = localStorage.getItem('portal')

    if (portal === 'admin') {
      setCurrentRole('Admin')
    } else {
      setCurrentRole('Recruiter')
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}') as StoredUser
    setUser(storedUser)

    if (storedUser?.id) {
      fetchNotifications(storedUser.id)
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark'
    localStorage.setItem('theme', nextTheme)
    applyTheme(nextTheme)
  }

  const fetchNotifications = async (userId: number) => {
    try {
      const data = await getUserNotifications(userId)
      setNotifications(
        data.map((entry: any) => ({
          id: String(entry.id),
          title: entry.title,
          description: entry.message,
          timestamp: new Date(entry.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: entry.is_read,
        }))
      )
    } catch (error) {
      console.error(error)
    }
  }

  const handleDismissNotification = async (notificationId: string) => {
    try {
      await deleteNotification(Number(notificationId))
      setNotifications((prev) => prev.filter((entry) => entry.id !== notificationId))
    } catch (error) {
      console.error(error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationRead(Number(notificationId))
      setNotifications((prev) =>
        prev.map((entry) =>
          entry.id === notificationId ? { ...entry, read: true } : entry
        )
      )
    } catch (error) {
      console.error(error)
    }
  }

  const getSearchIcon = (type: string) => {
    switch (type) {
      case 'candidate':
        return <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'position':
        return <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
      case 'pipeline':
        return <KanbanSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case 'interview':
        return <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default:
        return <Search className="h-4 w-4 text-slate-500 dark:text-slate-400" />
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowSearchResults(query.trim().length > 0)
    onSearch?.(query)
  }

  const handleSearchNavigate = (href: string) => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
    router.push(href)
  }

  const handleGlobalResultNavigate = (result: GlobalSearchResult) => {
    switch (result.type) {
      case 'candidate':
        router.push('/candidates')
        break
      case 'position':
        router.push('/positions')
        break
      case 'pipeline':
        router.push('/pipeline')
        break
      case 'interview':
        router.push('/interviews')
        break
      default:
        break
    }

    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false)
      setSearchQuery('')
      setSearchResults([])
      return
    }

    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleGlobalResultNavigate(searchResults[0])
        return
      }

      if (filteredSearchItems.length > 0) {
        handleSearchNavigate(filteredSearchItems[0].href)
      }
    }
  }

  const hasAnySearchResults =
    searchQuery.trim().length > 0 &&
    (loading || searchResults.length > 0 || filteredSearchItems.length > 0)

  return (
    <motion.div
      variants={item}
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setShowSearchResults(true)
                }
              }}
              placeholder="Search candidates, positions, pages..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
              {!searchQuery.trim() ? null : loading ? (
                <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
                  Searching...
                </div>
              ) : !hasAnySearchResults ? (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto py-1">
                  {searchResults.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Global results
                      </div>
                      {searchResults.map((result) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onClick={() => handleGlobalResultNavigate(result)}
                          className="group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                            {getSearchIcon(result.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-100 dark:text-slate-100">
                              {result.title}
                            </p>
                            {result.subtitle && (
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {result.subtitle}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {filteredSearchItems.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Navigate to
                      </div>
                      {filteredSearchItems.map((result) => (
                        <button
                          key={result.href}
                          type="button"
                          onClick={() => handleSearchNavigate(result.href)}
                          className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {result.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-100 dark:text-slate-100">
                              {result.label}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {result.href}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationsPanel
            notifications={notifications}
            onDismiss={handleDismissNotification}
            onMarkAsRead={handleMarkAsRead}
            showBadge={true}
            itemVariants={item}
          />

          <div className="relative">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                {user?.profile_photo ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${user.profile_photo}`}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-100 dark:text-slate-100">
                    {userEmail?.split('@')[0] || user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentRole}
                  </p>
                </div>

                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform dark:text-slate-400 ${
                    showProfileMenu ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </motion.button>

            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-100 dark:text-slate-100">
                    {userEmail || user?.email}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Account</p>
                </div>

                <div className="space-y-2 p-2">
                  {hasAdminPortalAccess() && hasRecruiterPortalAccess() && (
                    <div className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                        Switch Role
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('portal', 'admin')
                          setCurrentRole('Admin')
                          setShowProfileMenu(false)
                          router.replace('/admin/dashboard')
                          router.refresh()
                        }}
                        className="w-full rounded px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Admin
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('portal', 'recruiter')
                          setCurrentRole('Recruiter')
                          setShowProfileMenu(false)
                          router.replace('/dashboard')
                          router.refresh()
                        }}
                        className="w-full rounded px-2 py-2 text-left text-sm text-slate-100 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Recruiter
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      router.push('/settings')
                    }}
                    className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-100 hover:text-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false)
                      onLogout?.()
                    }}
                    className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}