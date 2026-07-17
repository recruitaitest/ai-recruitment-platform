'use client'

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { Sidebar } from './dashboard/Sidebar'
import { TopNavbar } from './dashboard/TopNavbar'
import { usePathname, useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { hasPermission } from '@/utils/permissions'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const isNested = useContext(AppLayoutContext)

  if (isNested) {
    return <>{children}</>
  }

  return <AppLayoutContent>{children}</AppLayoutContent>
}

const AppLayoutContext = createContext(false)

const PATH_PERMISSIONS: { [key: string]: string } = {
  '/candidates': 'candidates.view',
  '/resume-upload': 'candidates.create',
  '/semantic-search': 'ai_search.view',
  '/ai-copilot': 'ai_search.view',
  '/pipeline': 'pipelines.view',
  '/interviews': 'interviews.view',
  '/positions': 'positions.view',
  '/analytics': 'analytics.view',
  '/mailbox': 'mailbox.view',
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState('')
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  useEffect(() => {
    const authenticated = AuthService.isAuthenticated()

    if (!authenticated) {
      AuthService.logout()
      router.push('/login')
      return
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const isPendingUser = storedUser?.role === 'PENDING'

    if (isPendingUser && pathname !== '/waiting-approval') {
      setIsAuthorized(false)
      router.replace('/waiting-approval')
      return
    }

    // Check page permission
    let allowed = true
    for (const [route, permission] of Object.entries(PATH_PERMISSIONS)) {
      if (pathname.startsWith(route)) {
        allowed = hasPermission(permission, false)
        break
      }
    }

    if (!allowed) {
      const lastAllowed = sessionStorage.getItem('lastAllowedPath') || '/dashboard'
      router.replace(lastAllowed)
      return
    }

    // Save current path as last allowed path
    sessionStorage.setItem('lastAllowedPath', pathname)
    setIsAuthorized(true)
    const email = localStorage.getItem('user_email') || storedUser?.email || 'User'
    setUserEmail(email)
    
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarExpanded')
    if (savedSidebarState) {
      setSidebarExpanded(JSON.parse(savedSidebarState))
    }
  }, [pathname, router])

  const handleSidebarToggle = () => {
    const newState = !sidebarExpanded
    setSidebarExpanded(newState)
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState))
  }

  const handleLogout = () => {
    AuthService.logout()
    router.push('/login')
  }

  if (!isAuthorized) {
    return null
  }

  const marginClass = sidebarExpanded ? 'ml-64' : 'ml-20'

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          userEmail={userEmail} 
          isExpanded={sidebarExpanded}
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <div className={`flex-1 min-w-0 ${marginClass} transition-[margin] duration-300 ease-in-out`}>
          <main className="h-screen min-h-0 overflow-y-auto overflow-x-hidden">
            <TopNavbar userEmail={userEmail} onLogout={handleLogout} />
            {children}
          </main>
        </div>
      </div>
    </AppLayoutContext.Provider>
  )
}
