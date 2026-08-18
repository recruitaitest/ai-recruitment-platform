'use client'

import { ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { Sidebar } from './dashboard/Sidebar'
import { TopNavbar } from './dashboard/TopNavbar'
import { usePathname, useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import { hasPermission, isHiringManagerUser } from '@/utils/permissions'

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
  '/copilot': 'ai_search.view',
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
    const isHM = isHiringManagerUser()
    const targetHome = isHM ? '/portal/hiring-manager?tab=candidates' : '/dashboard'

    // Strict Access Control for Hiring Manager
    if (isHM) {
      const isAllowedHMRoute =
        pathname === '/portal/hiring-manager' ||
        pathname.startsWith('/portal/hiring-manager') ||
        pathname.startsWith('/candidates/') ||
        pathname.startsWith('/settings')

      if (!isAllowedHMRoute) {
        setIsAuthorized(false)
        router.replace('/portal/hiring-manager?tab=candidates')
        return
      }
    }
    
    // Background sync to catch role updates from the backend
    const syncUser = async () => {
      if (storedUser?.id) {
        try {
          const { getProfile } = await import('@/services/profileService')
          const profile = await getProfile(storedUser.id)
          const updatedUser = { ...storedUser, ...profile }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          window.dispatchEvent(new Event('user-updated'))

          // If role changed from PENDING to something else, redirect to target dashboard
          if (updatedUser.role !== 'PENDING' && pathname === '/waiting-approval') {
            router.replace(targetHome)
          } else if (updatedUser.role === 'PENDING' && pathname !== '/waiting-approval') {
            setIsAuthorized(false)
            router.replace('/waiting-approval')
          }
        } catch (error) {
          console.error("Failed to sync user profile", error)
        }
      }
    }
    syncUser()

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
      const lastAllowed = sessionStorage.getItem('lastAllowedPath') || targetHome
      router.replace(lastAllowed)
      return
    }

    // Save current path as last allowed path
    sessionStorage.setItem('lastAllowedPath', pathname)
    setIsAuthorized(true)

    const updateEmail = () => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const email = localStorage.getItem('user_email') || currentUser?.email || 'User'
      setUserEmail(email)
      
      // If the synced user role is no longer pending, and we're stuck on waiting-approval, move them.
      if (currentUser?.role && currentUser.role !== 'PENDING' && pathname === '/waiting-approval') {
         router.replace('/dashboard')
      }
    }
    
    updateEmail()
    
    // Load sidebar state from localStorage
    const savedSidebarState = localStorage.getItem('sidebarExpanded')
    if (savedSidebarState) {
      setSidebarExpanded(JSON.parse(savedSidebarState))
    }

    window.addEventListener('user-updated', updateEmail)
    return () => window.removeEventListener('user-updated', updateEmail)
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

  const marginClass = sidebarExpanded ? 'ml-60' : 'ml-20'

  return (
    <AppLayoutContext.Provider value={true}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          userEmail={userEmail} 
          isExpanded={sidebarExpanded}
          onToggle={handleSidebarToggle}
        />

        {/* Main Content */}
        <div className={`flex-1 min-w-0 ${marginClass} transition-[margin] duration-300 ease-in-out`}>
          <main className="h-screen min-h-0 overflow-y-auto overflow-x-hidden bg-background">
            <TopNavbar userEmail={userEmail} onLogout={handleLogout} />
            {children}
          </main>
        </div>
      </div>
    </AppLayoutContext.Provider>
  )
}
