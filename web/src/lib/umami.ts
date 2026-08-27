declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void
    }
  }
}

/**
 * Fires a custom Umami event if the analytics script actually loaded
 * (see env.ts's umamiWebsiteId/umamiScriptUrl) — silently does nothing
 * otherwise. Centralizes the safe-fallback check so no call site needs to
 * know or care whether analytics is configured.
 */
export function trackEvent(eventName: string, eventData?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  window.umami?.track(eventName, eventData)
}
