'use client'

import { motion } from 'framer-motion'
import {
    LayoutGrid,
    Users,
    BarChart3,
    Settings,
    Sparkles,
    KanbanSquare,
    Bot,
    Briefcase,
    CalendarDays,
    Mail,
    ShieldCheck,
    Upload,
    LogOut,
    ChevronLeft,
    Lock,
    FileText
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { getAISettings } from '@/services/adminService'
import { hasPermission } from "@/utils/permissions";

interface NavItem {
    id: string
    label: string
    icon: React.ReactNode
    href: string
    badge?: number
}

interface SidebarProps {
    isExpanded?: boolean
    onToggle?: () => void
    userEmail?: string
}

// Shared tooltip component — renders beside the icon when sidebar is collapsed.
// Uses CSS opacity + translate instead of hidden/block so Tailwind transitions work.
function Tooltip({ label, visible }: { label: string; visible: boolean }) {
    return (
        <div
            className={`
                pointer-events-none absolute left-[4.5rem] top-1/2 z-50
                -translate-y-1/2 whitespace-nowrap rounded-lg border
                border-white/20 bg-slate-900 px-3 py-2 text-sm
                font-medium text-white shadow-xl
                transition-all duration-200
                ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}
            `}
        >
            {label}
            {/* Arrow pointing left toward the sidebar */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
        </div>
    )
}

export function Sidebar({
    isExpanded = false,
    onToggle,
    userEmail,
}: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [portal, setPortal] = useState<'recruiter' | 'admin'>('recruiter')
    const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(true)

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        setUser(storedUser)

        const savedPortal = localStorage.getItem('portal')
        if (savedPortal === 'admin' || savedPortal === 'recruiter') {
            setPortal(savedPortal)
        }
    }, [])

    useEffect(() => {
        const fetchAISettings = async () => {
            try {
                const settings = await getAISettings()
                setSemanticSearchEnabled(settings.semantic_search !== false)
            } catch (error) {
                console.error(error)
            }
        }

        fetchAISettings()
    }, [])

    const role = user?.role

    const pendingNavItems: NavItem[] = [
        {
            id: 'waiting-approval',
            label: 'Waiting Approval',
            icon: <ShieldCheck className="w-5 h-5" />,
            href: '/waiting-approval',
        },
    ]

    const recruiterNavItems: NavItem[] = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutGrid className="w-5 h-5" />,
            href: '/dashboard',
        },
        ...(hasPermission("candidates.create", false)
            ? [{
                id: 'resume-upload',
                label: 'Resume Upload',
                icon: <Upload className="w-5 h-5" />,
                href: '/resume-upload',
            }]
            : []),
        ...(hasPermission("candidates.view", false)
            ? [{
                id: 'candidates',
                label: 'Candidates',
                icon: <Users className="w-5 h-5" />,
                href: '/candidates',
            }]
            : []),
        ...(hasPermission("ai_search.view", false) && semanticSearchEnabled
            ? [{
                id: 'semantic-search',
                label: 'AI Search',
                icon: <Sparkles className="w-5 h-5" />,
                href: '/semantic-search',
            }]
            : []),
        ...(hasPermission("ai_search.view", false) && semanticSearchEnabled
            ? [{
                id: 'copilot',
                label: 'AI Copilot',
                icon: <Bot className="w-5 h-5" />,
                href: '/ai-copilot',
            }]
            : []),
        ...(hasPermission("pipelines.view", false)
            ? [{
                id: 'pipeline',
                label: 'Pipeline',
                icon: <KanbanSquare className="w-5 h-5" />,
                href: '/pipeline',
            }]
            : []),
        ...(hasPermission("interviews.view", false)
            ? [{
                id: 'interviews',
                label: 'Interviews',
                icon: <CalendarDays className="w-5 h-5" />,
                href: '/interviews',
            }]
            : []),
        ...(hasPermission("offers.view", false)
            ? [{
                id: "offers",
                label: "Offers",
                icon: <FileText className="w-5 h-5" />,
                href: "/offers",
            }]
            : []),
        ...(hasPermission("positions.view", false)
            ? [{
                id: 'positions',
                label: 'Positions',
                icon: <Briefcase className="w-5 h-5" />,
                href: '/positions',
            }]
            : []),
        ...(hasPermission("analytics.view", false)
            ? [{
                id: 'analytics',
                label: 'Analytics',
                icon: <BarChart3 className="w-5 h-5" />,
                href: '/analytics',
            }]
            : []),
        ...(hasPermission("mailbox.view", false)
            ? [{
                id: 'mailbox',
                label: 'Mailbox',
                icon: <Mail className="w-5 h-5" />,
                href: '/mailbox',
            }]
            : []),
        {
            id: 'settings',
            label: 'Settings',
            icon: <Settings className="w-5 h-5" />,
            href: '/settings',
        },
    ]

    const adminNavItems: NavItem[] = [
        {
            id: 'admin-dashboard',
            label: 'Dashboard',
            icon: <LayoutGrid className="w-5 h-5" />,
            href: '/admin/dashboard',
        },

        ...(hasPermission("users.view", false)
            ? [{
                id: 'users',
                label: 'Users',
                icon: <Users className="w-5 h-5" />,
                href: '/admin/users',
            }]
            : []),

        ...(hasPermission("roles.view", false)
            ? [{
                id: 'roles',
                label: 'Roles',
                icon: <ShieldCheck className="w-5 h-5" />,
                href: '/admin/roles',
            }]
            : []),

        ...(hasPermission("security.view", false)
            ? [{
                id: 'security',
                label: 'Security',
                icon: <Lock className="w-5 h-5" />,
                href: '/admin/security',
            }]
            : []),

        ...(hasPermission("analytics.view", false)
            ? [{
                id: 'analytics',
                label: 'Analytics',
                icon: <BarChart3 className="w-5 h-5" />,
                href: '/admin/analytics',
            }]
            : []),

        ...(hasPermission("audit.view", false)
            ? [{
                id: 'audit-logs',
                label: 'Audit Logs',
                icon: <FileText className="w-5 h-5" />,
                href: '/admin/audit-logs',
            }]
            : []),

        ...(hasPermission("mailbox.view", false)
            ? [{
                id: 'mailbox',
                label: 'Mailbox',
                icon: <Mail className="w-5 h-5" />,
                href: '/admin/mailbox',
            }]
            : []),

        ...(hasPermission("settings.view", false)
            ? [{
                id: 'settings',
                label: 'Settings',
                icon: <Settings className="w-5 h-5" />,
                href: '/admin/settings',
            }]
            : []),
    ]

    const navItems =
        role === 'PENDING'
            ? pendingNavItems
            : portal === 'admin'
                ? adminNavItems
                : recruiterNavItems

    const handleLogout = () => {
        AuthService.logout()
        router.push('/login')
    }

    const profileRoute = '/settings'

    return (
        <div
            className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'
                }`}
        >
            {/* Toggle button */}
            <div className="flex items-center justify-center gap-2 border-b border-white/10 p-2">
                {isExpanded ? (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onToggle}
                        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Compress Sidebar"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-xs font-medium">Compress</span>
                    </motion.button>
                ) : (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={onToggle}
                        className="flex h-10 w-full items-center justify-center rounded-lg text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Expand Sidebar"
                    >
                        <ChevronLeft className="h-4 w-4 rotate-180" />
                    </motion.button>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                {navItems.map((item, index) => {
                    const isActive = pathname === item.href

                    return (
                        <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <motion.button
                                onClick={() => router.push(item.href)}
                                className={`group relative flex h-11 w-full items-center rounded-lg px-4 transition-all duration-200 ${isActive
                                    ? 'border border-blue-500/40 bg-blue-500/30 text-blue-300'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {/* Icon */}
                                <div className="flex w-10 flex-shrink-0 items-center justify-center">
                                    {item.icon}
                                </div>

                                {/* Label — only shown when expanded */}
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-1 items-center justify-center whitespace-nowrap text-sm font-medium"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}

                                {/* Badge */}
                                {item.badge !== undefined && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={`flex flex-shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white ${isExpanded
                                            ? 'h-5 w-5'
                                            : 'absolute right-1 top-1 h-4 w-4'
                                            }`}
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </motion.span>
                                )}
                            </motion.button>

                            {/* Tooltip — visible only when collapsed */}
                            {!isExpanded && (
                                <Tooltip
                                    label={item.label}
                                    visible={hoveredItem === item.id}
                                />
                            )}
                        </div>
                    )
                })}
            </nav>

            {/* Bottom section: Profile + Logout */}
            <div className="space-y-2 border-t border-white/10 p-2">
                {/* Profile button */}
                <div
                    className="relative"
                    onMouseEnter={() => setHoveredItem('profile')}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <motion.button
                        onClick={() => router.push(profileRoute)}
                        className="flex h-11 w-full items-center justify-start gap-3 rounded-lg px-3 text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex w-10 flex-shrink-0 items-center justify-center">
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

                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-1 items-center justify-center whitespace-nowrap text-sm font-medium"
                            >
                                Profile
                            </motion.span>
                        )}
                    </motion.button>

                    {!isExpanded && (
                        <Tooltip label="Profile" visible={hoveredItem === 'profile'} />
                    )}
                </div>

                {/* Logout button */}
                <div
                    className="relative"
                    onMouseEnter={() => setHoveredItem('logout')}
                    onMouseLeave={() => setHoveredItem(null)}
                >
                    <motion.button
                        onClick={handleLogout}
                        className="flex h-11 w-full items-center justify-start gap-3 rounded-lg px-3 text-red-400/60 transition-all hover:bg-red-500/10 hover:text-red-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex w-10 flex-shrink-0 items-center justify-center">
                            <LogOut className="h-5 w-5" />
                        </div>

                        {isExpanded && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-1 items-center justify-center whitespace-nowrap text-sm font-medium"
                            >
                                Logout
                            </motion.span>
                        )}
                    </motion.button>

                    {!isExpanded && (
                        <Tooltip label="Logout" visible={hoveredItem === 'logout'} />
                    )}
                </div>
            </div>
        </div>
    )
}
