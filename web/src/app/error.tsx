'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Next.js requires error.tsx to be a Client Component (error boundaries
// only work client-side). Replaces the generic default error screen with
// one styled like the rest of the site.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main id="main-content" className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Error</p>
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-muted">An unexpected error occurred. You can try again, or head back home.</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.97]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent active:translate-y-0 active:scale-[0.97]"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
