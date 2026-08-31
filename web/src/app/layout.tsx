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
import { SectionViewTracker } from '@/components/analytics/section-view-tracker'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const title = settings?.seo?.title || settings?.name || 'Portfolio'
  const description = settings?.seo?.description || settings?.title || ''
  const ogImage = settings?.seo?.ogImage ? urlFor(settings.seo.ogImage).width(1200).height(630).url() : undefined

  return {
    // Only set when configured — an unset metadataBase just means Next
    // can't resolve relative URLs into absolute ones, which this project
    // avoids elsewhere anyway (ogImage above is already absolute).
    metadataBase: env.siteUrl ? new URL(env.siteUrl) : undefined,
    title,
    description,
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
  // never breaking the page. See README.md's "Analytics" section.
  const analyticsEnabled = Boolean(env.umamiWebsiteId && env.umamiScriptUrl)
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
    <html lang="en" suppressHydrationWarning className={htmlClassName}>
      <head>{themeCss && <style dangerouslySetInnerHTML={{ __html: themeCss }} />}</head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
        >
          Skip to content
        </a>
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
