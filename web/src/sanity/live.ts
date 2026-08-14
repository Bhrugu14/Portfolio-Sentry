import { defineLive } from 'next-sanity/live'
import { env } from '@/lib/env'
import { client } from './client'

export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: '2026-08-10' }),
  serverToken: env.sanityReadToken,
  browserToken: env.sanityReadToken,
})
