import type { Metadata } from 'next'
import { RootAppShell } from '@/components/RootAppShell'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './global.css'

export const metadata: Metadata = {
  title: 'RecruitAI',
  description: 'AI Resume Management & Recruitment Intelligence Platform',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'dark';
                  var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="gradient-bg text-white min-h-screen">
        <GoogleOAuthProvider
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
        >
          <RootAppShell>
            {children}
          </RootAppShell>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}