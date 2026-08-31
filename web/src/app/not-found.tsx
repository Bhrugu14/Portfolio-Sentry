import Link from 'next/link'

// Replaces Next.js's generic default 404 with one styled the same as the
// rest of the site (uses the same CSS custom properties every theme
// defines, so it automatically matches whichever theme is active).
export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <Link
        href="/"
        className="mt-4 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-all hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 active:scale-[0.97]"
      >
        Back to home
      </Link>
    </main>
  )
}
