'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'

// A no-op subscription: this "store" never changes after mount, so nothing
// ever needs to notify React of a further update.
const subscribe = () => () => {}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // True only once hydration is complete. Using useSyncExternalStore instead
  // of a useEffect+setState pair avoids the "setState in an effect body"
  // lint warning while doing the exact same job: the server snapshot (false)
  // matches the client's first render to avoid a hydration mismatch, then
  // React automatically re-renders with the client snapshot (true).
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  if (!mounted) {
    // Avoid a hydration mismatch: render a fixed-size placeholder until
    // next-themes knows the resolved theme on the client.
    return <div className="h-9 w-9" aria-hidden="true" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
