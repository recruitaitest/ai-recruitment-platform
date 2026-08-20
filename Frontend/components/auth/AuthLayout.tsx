"use client";

import { ReactNode, useEffect, useState } from 'react'
import { AILoginBackground } from './AILoginBackground'

import GlowBorder from '@/components/GlowBorder'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({
  children,
  title,
  subtitle,
}: AuthLayoutProps) {
  const [displayTitle, setDisplayTitle] = useState(title)

  useEffect(() => {
    if (title === "RecruitAI") {
      fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000') + '/admin/settings/public')
        .then(res => res.json())
        .then(data => {
          if (data && data.platform_name) {
            setDisplayTitle(data.platform_name)
          }
        })
        .catch(err => console.error(err));
    }
  }, [title])

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 overflow-hidden bg-[#070b14]">
      <AILoginBackground />

      {/* Floating Dark Glass Container with Official Originkit Glow Border */}
      <div className="relative z-10 w-full max-w-[440px] overflow-visible">
        <GlowBorder
          glowColor="#7086fd"
          tailColor="rgba(112, 134, 253, 0.45)"
          baseColor="rgba(112, 134, 253, 0.08)"
          speed={14}
          glowOpacity={0.4}
          glowBlur={18}
          rounded={32}
          borderWidth={2}
          containerClassName="p-[2px] overflow-visible"
        >
          <div className="w-full rounded-[30px] border border-indigo-500/20 bg-[#0c1427]/85 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(112,134,253,0.15),0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="mb-6 sm:mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {displayTitle}
              </h1>

              <p className="mt-2 text-xs font-medium text-indigo-200/80 tracking-wide uppercase">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </GlowBorder>
      </div>
    </div>
  )
}