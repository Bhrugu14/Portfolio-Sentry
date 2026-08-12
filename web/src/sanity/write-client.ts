import 'server-only'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from './env'

// Used only from server-only route handlers (e.g. api/contact) to create
// documents. Never import this from a client component.
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})
