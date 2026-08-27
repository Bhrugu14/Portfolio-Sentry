// Single source of truth for this app's environment variables. Add new vars
// here (and to .env.local.example + README.md's env table) rather than
// reading process.env directly elsewhere in the codebase.

// Next.js inlines NEXT_PUBLIC_* vars into the client bundle by statically
// matching a literal `process.env.NEXT_PUBLIC_X` in the source — a computed
// key like `process.env[name]` defeats that analysis and silently becomes
// `undefined` in the browser. So `required()` takes the already-read value
// rather than reading it itself; every call site below must still write out
// `process.env.THE_LITERAL_NAME` directly.
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

export const env = {
  // Required — the app cannot run without a Sanity project to read from.
  sanityProjectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID', process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
  sanityDataset: required('NEXT_PUBLIC_SANITY_DATASET', process.env.NEXT_PUBLIC_SANITY_DATASET),

  // Optional — each feature below degrades gracefully when its var is unset.
  sanityReadToken: process.env.SANITY_API_READ_TOKEN, // drafts/preview
  sanityWriteToken: process.env.SANITY_API_WRITE_TOKEN, // contact form persistence
  resendApiKey: process.env.RESEND_API_KEY, // contact email notification
  contactEmailTo: process.env.CONTACT_EMAIL_TO, // contact email notification
  umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID, // analytics (self-hosted Umami)
  umamiScriptUrl: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL, // analytics (self-hosted Umami)
}
