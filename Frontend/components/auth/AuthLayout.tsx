"use client";

import { ReactNode, useEffect, useState } from 'react'

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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0B1120] via-[#111827] to-[#172554] px-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a]/70 p-8 shadow-2xl backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white">
                        {displayTitle}
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        {subtitle}
                    </p>
                </div>

                {children}
            </div>
        </div>
    )
}