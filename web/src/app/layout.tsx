import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ThemeProvider } from '@/components/theme-provider'
import { env } from '@/lib/env'
import { SanityLive, sanityFetch } from '@/sanity/live'
import { SITE_SETTINGS_QUERY } from '@/sanity/queries'
import { urlFor } from '@/sanity/image'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await sanityFetch({ query: SITE_SETTINGS_QUERY, stega: false })

  const title = settings?.seo?.title || settings?.name || 'Portfolio'
  const description = settings?.seo?.description || settings?.title || ''
  const ogImage = settings?.seo?.ogImage ? urlFor(settings.seo.ogImage).width(1200).height(630).url() : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = env.gaMeasurementId

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
        <SanityLive />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  )
}
