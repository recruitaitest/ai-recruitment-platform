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
    FileText,
    Zap,
    Share2,
    Building,
    Award
} from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { getAISettings } from '@/services/adminService'
import { hasPermission } from "@/utils/permissions";
import { getProfilePhotoUrl } from "@/lib/utils";

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
    if (!visible) return null;
    return (
        <div
            className="pointer-events-none fixed left-[4.75rem] z-50 whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary shadow-xl transition-all duration-200"
            style={{ transform: "translateY(-50%)" }}
        >
            {label}
            {/* Arrow pointing left toward the sidebar */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
        </div>
    )
}

function SidebarInner({
    isExpanded = false,
    onToggle,
    userEmail,
}: SidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [hoveredItem, setHoveredItem] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)
    const [portal, setPortal] = useState<'recruiter' | 'admin' | 'hiring-manager'>('recruiter')
    const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(true)
    const [activeAIProvider, setActiveAIProvider] = useState<string | null>(null)
    const canManageAI = hasPermission("ai_settings.manage", true)


    useEffect(() => {
        const loadUser = () => {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
            setUser(storedUser)
        }
        
        const loadPortal = () => {
            const savedPortal = localStorage.getItem('portal')
            if (savedPortal === 'admin' || savedPortal === 'recruiter' || savedPortal === 'hiring-manager' || savedPortal === 'hiring_manager') {
                setPortal(savedPortal === 'hiring_manager' ? 'hiring-manager' : (savedPortal as any))
            }
        }

        loadUser()
        loadPortal()

        window.addEventListener('user-updated', loadUser)
        window.addEventListener('portal-changed', loadPortal)
        window.addEventListener('storage', loadPortal)

        return () => {
            window.removeEventListener('user-updated', loadUser)
            window.removeEventListener('portal-changed', loadPortal)
            window.removeEventListener('storage', loadPortal)
        }
    }, [])

    useEffect(() => {
        const fetchAISettings = async () => {
            try {
                const settings = await getAISettings()
                setSemanticSearchEnabled(settings.semantic_search !== false)
                if (settings.active_provider) {
                    setActiveAIProvider(settings.active_provider)
                }
            } catch (error) {
                console.error(error)
            }
        }

        fetchAISettings()
    }, [])

    const role = user?.role === 'COMPANY_OWNER' ? 'SUPER_ADMIN' : user?.role

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
            ? [
                {
                    id: 'semantic-search',
                    label: 'AI Search',
                    icon: <Sparkles className="w-5 h-5" />,
                    href: '/semantic-search',
                },
                {
                    id: 'ai-copilot',
                    label: 'AI Copilot',
                    icon: <Bot className="w-5 h-5" />,
                    href: '/copilot',
                }
            ]
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
        {
            id: 'admin-automation',
            label: 'Automation',
            icon: <Zap className="w-5 h-5 text-blue-400" />,
            href: '/admin/automation',
        },
        {
            id: 'admin-ai-processing',
            label: 'AI Processing',
            icon: <Bot className="w-5 h-5 text-emerald-400" />,
            href: '/admin/ai',
        },
        {
            id: 'admin-integrations',
            label: 'Integrations',
            icon: <Share2 className="w-5 h-5 text-indigo-400" />,
            href: '/admin/integrations',
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

    const userPermsStr = Array.isArray(user?.permissions)
        ? user.permissions.join(",").toLowerCase()
        : typeof user?.permissions === "string"
        ? user.permissions.toLowerCase()
        : "";

    const userRoleStr = String(user?.role || "").toLowerCase();

    const isHiringManager =
        userRoleStr.includes("hiring manager") ||
        userPermsStr.includes("type:hiring_manager") ||
        userPermsStr.includes("hiring_manager");

    const hiringManagerNavItems: NavItem[] = [
        {
            id: 'assigned-candidates',
            label: 'Assigned Candidates',
            icon: <Users className="w-5 h-5 text-indigo-400" />,
            href: '/portal/hiring-manager?tab=candidates',
        },
        {
            id: 'assigned-interviews',
            label: 'My Assigned Interviews',
            icon: <CalendarDays className="w-5 h-5 text-blue-400" />,
            href: '/portal/hiring-manager?tab=interviews',
        },
        {
            id: 'completed-scorecards',
            label: 'Completed Scorecards',
            icon: <Award className="w-5 h-5 text-emerald-400" />,
            href: '/portal/hiring-manager?tab=scorecards',
        },
        {
            id: 'settings',
            label: 'Profile Settings',
            icon: <Settings className="w-5 h-5" />,
            href: '/settings',
        },
    ];

    const isHiringPortalRoute = pathname.startsWith('/portal/hiring-manager');
    const isAdminRoute = pathname.startsWith('/admin');

    const navItems =
        role === 'PENDING'
            ? pendingNavItems
            : (portal === 'hiring-manager' || isHiringPortalRoute || isHiringManager)
                ? hiringManagerNavItems
                : (portal === 'admin' || isAdminRoute)
                    ? adminNavItems
                    : recruiterNavItems

    const handleLogout = () => {
        AuthService.logout()
        router.push('/login')
    }

    const profileRoute = '/settings'

    return (
        <aside
            className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface transition-[width] duration-300 ease-in-out overflow-x-hidden ${isExpanded ? 'w-60' : 'w-20'
                }`}
        >
            {/* Top section: Profile */}
            <div className="flex h-[72px] items-center border-b border-border p-3">
                <button
                    onClick={() => router.push(profileRoute)}
                    className="flex w-full items-center justify-start gap-3 rounded-xl p-2 text-text-primary transition-all duration-base ease-standard focus-ring hover:bg-surface-hover"
                    title="Profile & Account Settings"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-ai-accent text-sm font-bold text-white shadow-sm">
                        {user?.profile_photo && getProfilePhotoUrl(user.profile_photo) ? (
                            <img
                                src={getProfilePhotoUrl(user.profile_photo)!}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                        )}
                    </div>

                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col text-left min-w-0 flex-1"
                        >
                            <span className="truncate text-sm font-semibold text-text-primary">
                                {user?.name || userEmail?.split('@')[0] || 'Recruiter'}
                            </span>
                            <span className="truncate text-xs text-text-secondary">
                                {role || 'Recruiter'}
                            </span>
                        </motion.div>
                    )}
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {navItems.map((item) => {
                    const checkIsActive = () => {
                        if (item.href.includes('?')) {
                            const [itemPath, itemQuery] = item.href.split('?')
                            if (pathname !== itemPath) return false

                            const params = new URLSearchParams(itemQuery)
                            const targetTab = params.get('tab')
                            const activeTab = searchParams?.get('tab') || 'candidates'
                            return targetTab === activeTab
                        }

                        if (pathname === item.href) return true
                        if (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href)) return true
                        return false
                    }

                    const isActive = checkIsActive()

                    return (
                        <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => setHoveredItem(item.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                        >
                            <button
                                onClick={() => router.push(item.href)}
                                className={`group relative flex h-11 w-full items-center rounded-lg px-4 transition-all duration-base ease-standard focus-ring ${isActive
                                    ? 'text-primary font-medium'
                                    : 'text-secondary hover:bg-surface-hover hover:text-primary hover:scale-[1.02] active:scale-95'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 rounded-lg bg-primary/10 shadow-[inset_3px_0_0_0_var(--primary)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                {/* Icon */}
                                <div className="relative z-10 flex w-10 flex-shrink-0 items-center justify-center">
                                    {item.icon}
                                </div>

                                {/* Label — only shown when expanded */}
                                {isExpanded && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="relative z-10 ml-3 truncate font-medium text-sm"
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
                            </button>

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

            {/* Bottom section: Compress / Expand Sidebar toggle */}
            <div className="border-t border-border p-2">
                <button
                    onClick={onToggle}
                    className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface-hover text-text-secondary transition-all duration-base ease-standard focus-ring hover:border-primary/40 hover:text-primary hover:scale-[1.02] active:scale-95"
                    title={isExpanded ? "Compress Sidebar" : "Expand Sidebar"}
                >
                    <ChevronLeft className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? '' : 'rotate-180'}`} />
                    {isExpanded && (
                        <span className="text-xs font-semibold">Compress Sidebar</span>
                    )}
                </button>
            </div>
        </aside>
    )
}

export function Sidebar(props: SidebarProps) {
    return (
        <Suspense fallback={
            <aside className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-surface ${props.isExpanded ? 'w-60' : 'w-20'}`} />
        }>
            <SidebarInner {...props} />
        </Suspense>
    )
}
