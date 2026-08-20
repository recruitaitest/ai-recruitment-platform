'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary px-4">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold text-red-500">Something went wrong!</h2>
        <p className="text-muted text-sm">
          {error?.message || 'An unexpected error occurred.'}
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition"
          >
            Try again
          </button>
          <a
            href="/login"
            className="px-5 py-2.5 rounded-xl bg-surface-hover border border-border text-text-primary font-medium hover:bg-surface transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
