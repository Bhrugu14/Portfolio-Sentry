import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { env } from '@/lib/env'
import { computeThemeTokens, computeDarkThemeTokens, type ThemeColorPicks, type ThemeTokens } from '@/lib/color-math'
import { resolveThemeName } from '@/lib/theme-registry'
import { SanityLive, sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { urlFor } from '@/sanity/image'
import { CursorGlow } from '@/components/ui/cursor-glow'
import { BackgroundEffect } from '@/components/ui/background-effect'
import { SectionViewTracker } from '@/components/analytics/section-view-tracker'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const title = settings?.seo?.title || settings?.name || 'Portfolio'
  const description = settings?.seo?.description || settings?.title || ''
  const ogImage = settings?.seo?.ogImage ? urlFor(settings.seo.ogImage).width(1200).height(630).url() : undefined
  const favicon = settings?.seo?.favicon ? urlFor(settings.seo.favicon).width(180).height(180).url() : undefined

  return {
    // Only set when configured — an unset metadataBase just means Next
    // can't resolve relative URLs into absolute ones, which this project
    // avoids elsewhere anyway (ogImage above is already absolute).
    metadataBase: env.siteUrl ? new URL(env.siteUrl) : undefined,
    title,
    description,
    // Omitted entirely when unset — Next then falls back to the default
    // src/app/favicon.ico file convention, same safe-fallback pattern as
    // everything else in this project.
    icons: favicon ? { icon: favicon, apple: favicon } : undefined,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

function tokensToCssBlock(selector: string, tokens: ThemeTokens): string {
  return `${selector} {
    --background: ${tokens.background};
    --foreground: ${tokens.foreground};
    --surface: ${tokens.surface};
    --border: ${tokens.border};
    --muted: ${tokens.muted};
    --accent: ${tokens.accent};
    --accent-foreground: ${tokens.accentForeground};
  }`
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

function isCompletePicks(colors: Partial<Record<keyof ThemeColorPicks, string | null | undefined>> | null | undefined): colors is ThemeColorPicks {
  return Boolean(
    colors?.background && HEX_COLOR_PATTERN.test(colors.background) &&
    colors?.text && HEX_COLOR_PATTERN.test(colors.text) &&
    colors?.accent && HEX_COLOR_PATTERN.test(colors.accent),
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Analytics is fully optional — unset either var and it's silently skipped,
  // never breaking the page. See README.md's "Analytics" section. Also
  // skipped outside production so `npm run dev` (and local builds you just
  // `next start`) never registers real events — the script never loads, so
  // there's nothing for trackEvent()'s window.umami check to find.
  const analyticsEnabled = Boolean(env.umamiWebsiteId && env.umamiScriptUrl) && process.env.NODE_ENV === 'production'
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const appearance = settings?.appearance
  const activeTheme = resolveThemeName(appearance?.activeTheme)
  const picks = activeTheme === 'professional' ? appearance?.professional : appearance?.minimal

  // Additive by design: if appearance data isn't there yet, render nothing
  // extra and fall back to globals.css's existing hardcoded defaults.
  const themeCss = isCompletePicks(picks)
    ? `${tokensToCssBlock(':root', computeThemeTokens(picks))}\n${tokensToCssBlock('.dark', computeDarkThemeTokens(picks))}`
    : null
  const htmlClassName = `theme-${activeTheme}`
  const cursorGlowEnabled = appearance?.cursorGlowEnabled !== false

  return (
    <html lang="en" suppressHydrationWarning>
      <head>{themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}</head>
      {/* theme-{name} lives on body, not html: html's class attribute is owned by
          next-themes (attribute="class", for .dark) — putting both on the same
          element meant a Sanity live re-render of this className overwrote the
          dark class next-themes had set outside React's tracking, silently
          reverting to light mode until the toggle was clicked twice. */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased ${htmlClassName}`}>
        <a
          href="#main-content"
          className="sr-only rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
        <BackgroundEffect kind={appearance?.backgroundEffect} />
        {cursorGlowEnabled && <CursorGlow />}
        <ThemeProvider>{children}</ThemeProvider>
        <SanityLive />
        {analyticsEnabled && (
          <>
            <Script src={env.umamiScriptUrl} data-website-id={env.umamiWebsiteId} strategy="afterInteractive" />
            <SectionViewTracker />
          </>
        )}
      </body>
    </html>
  )
}
