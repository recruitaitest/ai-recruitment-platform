'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-red-400">Critical Application Error</h2>
          <p className="text-slate-400 text-sm">
            {error?.message || 'A critical error occurred.'}
          </p>
          <div className="pt-4">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
