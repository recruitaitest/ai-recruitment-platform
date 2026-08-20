import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-primary px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted text-sm">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-hover transition"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
