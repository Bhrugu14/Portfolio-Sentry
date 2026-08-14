// Single source of truth for this app's environment variables. Add new vars
// here (and to .env.local.example + README.md's env table) rather than
// reading process.env directly elsewhere in the codebase.

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const env = {
  // Required — the app cannot run without a Sanity project to read from.
  sanityProjectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  sanityDataset: required('NEXT_PUBLIC_SANITY_DATASET'),

  // Optional — each feature below degrades gracefully when its var is unset.
  sanityReadToken: process.env.SANITY_API_READ_TOKEN, // drafts/preview
  sanityWriteToken: process.env.SANITY_API_WRITE_TOKEN, // contact form persistence
  resendApiKey: process.env.RESEND_API_KEY, // contact email notification
  contactEmailTo: process.env.CONTACT_EMAIL_TO, // contact email notification
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, // analytics
}
