'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AppLayout } from './AppLayout'
import { getTheme, applyTheme } from '@/utils/theme'
import { Toaster } from 'sonner'

interface RootAppShellProps {
  children: ReactNode
}

const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
])

export function RootAppShell({ children }: RootAppShellProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("🚀 [DEBUG] NEXT_PUBLIC_API_URL is:", process.env.NEXT_PUBLIC_API_URL);
      console.log("🚀 [DEBUG] Evaluated URL:", (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'));
    }

    // Initialize theme on mount
    const currentTheme = getTheme();
    applyTheme(currentTheme);

    // Fetch platform name and set title
    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/admin/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data && data.platform_name) {
          document.title = data.platform_name + " | AI Resume Management";
        }
      })
      .catch(err => console.error(err));

    // Handle cross-tab/window localStorage sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        applyTheme((e.newValue as any) || 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Handle system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const activeTheme = localStorage.getItem('theme') || 'dark';
      if (activeTheme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      mediaQuery.removeEventListener('change', handleSystemChange);
    };
  }, []);

  if (PUBLIC_ROUTES.has(pathname) || pathname.startsWith('/admin')) {
    return (
      <>
        {children}
        <Toaster richColors position="top-right" theme="dark" />
      </>
    )
  }

  return (
    <>
      <AppLayout>{children}</AppLayout>
      <Toaster richColors position="top-right" theme="dark" />
    </>
  )
}
