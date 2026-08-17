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
 Keyboard,
 Command,
 HelpCircle,
 Bot,
} from 'lucide-react'
import { CommandPalette } from '@/components/common/CommandPalette'
import { KeyboardShortcutsModal } from '@/components/common/KeyboardShortcutsModal'
import { useRouter } from 'next/navigation'

import { globalSearch } from '@/services/globalSearchService'
import { getAISettings } from '@/services/adminService'
import { hasAdminPortalAccess, hasRecruiterPortalAccess, hasPermission } from '@/utils/permissions'
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
 const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
 const [shortcutsOpen, setShortcutsOpen] = useState(false)
 const [activeAIProvider, setActiveAIProvider] = useState<string | null>(null)
 const canManageAI = hasPermission("ai_settings.manage", true)

 // Global Keyboard Shortcuts (Ctrl+K, ?, Sequence shortcuts g c, g p, g j, g i, g a)
 useEffect(() => {
   let keyBuffer = ''
   let keyTimer: any = null

   const handleGlobalKeyDown = (e: KeyboardEvent) => {
     const activeTag = (document.activeElement?.tagName || '').toLowerCase()
     const isInput = activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable

     // Ctrl + K or Cmd + K
     if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
       e.preventDefault()
       setCommandPaletteOpen((prev) => !prev)
       return
     }

     if (isInput) return

     // Shift + ?
     if (e.key === '?') {
       e.preventDefault()
       setShortcutsOpen((prev) => !prev)
       return
     }

     // Sequence navigation (g then c/p/j/i/a)
     const key = e.key.toLowerCase()
     if (key === 'g' || keyBuffer === 'g') {
       if (keyBuffer === 'g') {
         keyBuffer = ''
         clearTimeout(keyTimer)
         if (key === 'd') router.push('/dashboard')
         else if (key === 'c') router.push('/candidates')
         else if (key === 'p') router.push('/pipeline')
         else if (key === 'j') router.push('/positions')
         else if (key === 'i') router.push('/interviews')
         else if (key === 'a') router.push('/admin/automation')
       } else if (key === 'g') {
         keyBuffer = 'g'
         keyTimer = setTimeout(() => { keyBuffer = '' }, 1000)
       }
     }
   }

   window.addEventListener('keydown', handleGlobalKeyDown)
   return () => {
     window.removeEventListener('keydown', handleGlobalKeyDown)
     if (keyTimer) clearTimeout(keyTimer)
   }
 }, [router])

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

 const loadUser = () => {
 const storedUser = JSON.parse(localStorage.getItem('user') || '{}') as StoredUser
 setUser(storedUser)
 if (storedUser?.id) {
 fetchNotifications(storedUser.id)
 }
 }

 loadUser()

 window.addEventListener('user-updated', loadUser)
 return () => window.removeEventListener('user-updated', loadUser)
 }, [])

 useEffect(() => {
    const fetchAI = async () => {
      try {
        const settings = await getAISettings()
        if (settings?.active_provider) {
          setActiveAIProvider(settings.active_provider)
        }
      } catch { /* silent */ }
    }
    fetchAI()

    // Update badge immediately when user saves from the AI settings page
    const handleAIChange = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.provider) setActiveAIProvider(detail.provider)
    }
    window.addEventListener('ai-provider-changed', handleAIChange)

    return () => {
      window.removeEventListener('ai-provider-changed', handleAIChange)
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
 return <Users className="h-4 w-4 text-primary" />
 case 'position':
 return <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
 case 'pipeline':
 return <KanbanSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
 case 'interview':
 return <CalendarDays className="h-4 w-4 text-purple-600 dark:text-purple-400" />
 default:
 return <Search className="h-4 w-4 text-muted dark:text-muted" />
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
 className="sticky top-0 z-50 flex h-[72px] items-center border-b border-border bg-surface px-6"
 >
 <div className="flex w-full items-center justify-between gap-4">
 <div className="relative max-w-sm flex-1 transition-all duration-base ease-standard focus-within:max-w-md" ref={searchRef}>
 <div className="relative flex items-center">
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
 placeholder="Search candidates, reports..."
 className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-100/90 pl-4 pr-10 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-500 hover:bg-slate-200/80 hover:border-slate-300 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700/60 dark:bg-[#222B40] dark:text-white dark:placeholder:text-slate-400 dark:hover:bg-[#28334C] dark:focus:bg-[#1C2436] dark:focus:border-primary dark:focus:ring-primary/30"
 />
 <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400 transition-colors" />
 </div>

 {showSearchResults && (
 <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-border dark:bg-surface">
 {!searchQuery.trim() ? null : loading ? (
 <div className="p-4 text-sm text-muted dark:text-muted">
 Searching...
 </div>
 ) : !hasAnySearchResults ? (
 <div className="p-4 text-center text-sm text-muted dark:text-muted">
 No results found for &quot;{searchQuery}&quot;
 </div>
 ) : (
 <div className="max-h-96 overflow-y-auto py-1">
 {searchResults.length > 0 && (
 <>
 <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted dark:text-muted">
 Global results
 </div>
 {searchResults.map((result) => (
 <button
 key={`${result.type}-${result.id}`}
 type="button"
 onClick={() => handleGlobalResultNavigate(result)}
 className="group flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-secondary-surface"
 >
 <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-50 dark:border-border dark:bg-secondary-surface">
 {getSearchIcon(result.type)}
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-primary dark:text-primary">
 {result.title}
 </p>
 {result.subtitle && (
 <p className="truncate text-xs text-muted dark:text-muted">
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
 <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted dark:text-muted">
 Navigate to
 </div>
 {filteredSearchItems.map((result) => (
 <button
 key={result.href}
 type="button"
 onClick={() => handleSearchNavigate(result.href)}
 className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-secondary-surface"
 >
 <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-slate-50 text-muted dark:border-border dark:bg-secondary-surface dark:text-secondary">
 {result.icon}
 </div>
 <div>
 <p className="text-sm font-medium text-primary dark:text-primary">
 {result.label}
 </p>
 <p className="text-xs text-muted dark:text-muted">
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

 <div className="flex items-center gap-3">

 {/* AI Agent Badge */}
 {activeAIProvider && (
 canManageAI ? (
 <button
 onClick={() => router.push('/admin/ai')}
 title="Click to change AI provider"
 className="hidden md:flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400 transition-all hover:bg-violet-500/20 hover:border-violet-400/50 hover:scale-[1.02] active:scale-95"
 >
 <span className="relative flex h-2 w-2 flex-shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
 </span>
 <Bot className="w-3.5 h-3.5" />
 AI Agent: {activeAIProvider}
 </button>
 ) : (
 <div
 title="Active AI Agent"
 className="hidden md:flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-600 dark:text-violet-400"
 >
 <span className="relative flex h-2 w-2 flex-shrink-0">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
 <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
 </span>
 <Bot className="w-3.5 h-3.5" />
 AI Agent: {activeAIProvider}
 </div>
 )
 )}

    {/* Command Palette Trigger Button */}
    <button
      onClick={() => setCommandPaletteOpen(true)}
      type="button"
      className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-semibold text-text-primary hover:bg-surface-hover dark:border-border dark:bg-secondary-surface transition-all"
    >
      <Command className="w-3.5 h-3.5 text-blue-500" />
      <span>Quick Actions</span>
      <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-surface border border-border rounded text-muted">
        Ctrl+K
      </kbd>
    </button>

    {/* Keyboard Shortcuts Help Button */}
    <button
      onClick={() => setShortcutsOpen(true)}
      type="button"
      title="Keyboard Shortcuts (?)"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted transition-all hover:bg-surface-hover hover:scale-[1.02] active:scale-95 dark:border-border dark:bg-secondary-surface dark:text-primary"
    >
      <Keyboard className="h-4 w-4" />
    </button>

 <button
 onClick={toggleTheme}
 type="button"
 className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-muted transition-all duration-base ease-standard focus-ring hover:bg-surface-hover hover:scale-[1.02] active:scale-95 dark:border-border dark:bg-secondary-surface dark:text-primary dark:hover:bg-surface-hover"
 >
 <div className="relative flex h-4 w-4 items-center justify-center">
 <Sun className={`absolute h-4 w-4 transition-all duration-base ease-standard ${isDark ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
 <Moon className={`absolute h-4 w-4 transition-all duration-base ease-standard ${isDark ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
 </div>
 </button>

 <NotificationsPanel
 notifications={notifications}
 onDismiss={handleDismissNotification}
 onMarkAsRead={handleMarkAsRead}
 showBadge={true}
 itemVariants={item}
 />

 <div className="relative">
 <button
 type="button"
 onClick={() => setShowProfileMenu((prev) => !prev)}
 className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 transition-all duration-base ease-standard focus-ring hover:bg-surface-hover hover:scale-[1.02] active:scale-95 dark:border-border dark:bg-secondary-surface dark:hover:border-slate-600 dark:hover:bg-surface-hover"
 >
 <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
 {user?.profile_photo ? (
 <img
 src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/${user.profile_photo}`}
 alt="Profile"
 className="h-8 w-8 rounded-full object-cover"
 />
 ) : (
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-ai-accent">
 <span className="text-sm font-bold text-white">
 {user?.name?.charAt(0)?.toUpperCase() || 'U'}
 </span>
 </div>
 )}
 </div>

 <div className="hidden items-center gap-2 sm:flex">
 <div className="text-right">
 <p className="text-sm font-medium text-primary dark:text-primary">
 {userEmail?.split('@')[0] || user?.name || 'User'}
 </p>
 <p className="text-xs text-muted dark:text-muted">
 {currentRole}
 </p>
 </div>

 <ChevronDown
 className={`h-4 w-4 text-muted transition-transform dark:text-muted ${
 showProfileMenu ? 'rotate-180' : ''
 }`}
 />
 </div>
 </button>

 {showProfileMenu && (
 <motion.div
 initial={{ opacity: 0, y: -10, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -10, scale: 0.95 }}
 transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
 className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:border-border dark:bg-surface"
 >
 <div className="border-b border-border p-4 dark:border-border">
 <p className="text-sm font-medium text-text-primary dark:text-text-primary">
 {userEmail || user?.email}
 </p>
 <p className="text-xs text-muted dark:text-muted">Account</p>
 </div>

 <div className="space-y-2 p-2">
 {hasAdminPortalAccess() && hasRecruiterPortalAccess() && (
 <div className="border-b border-border px-3 py-2 dark:border-border">
 <p className="mb-2 text-xs text-muted dark:text-muted">
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
 className={`w-full rounded px-2 py-2 text-left text-sm ${currentRole === 'Admin' ? 'text-primary bg-primary/5' : 'text-text-primary'} hover:bg-slate-100 dark:hover:bg-secondary-surface`}
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
 className={`w-full rounded px-2 py-2 text-left text-sm ${currentRole === 'Recruiter' ? 'text-primary bg-primary/5' : 'text-text-primary'} hover:bg-slate-100 dark:hover:bg-secondary-surface`}
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
 className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-slate-100 dark:hover:bg-secondary-surface"
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

 <CommandPalette
    isOpen={commandPaletteOpen}
    onClose={() => setCommandPaletteOpen(false)}
  />

  <KeyboardShortcutsModal
    isOpen={shortcutsOpen}
    onClose={() => setShortcutsOpen(false)}
  />
 </motion.div>
 )
}