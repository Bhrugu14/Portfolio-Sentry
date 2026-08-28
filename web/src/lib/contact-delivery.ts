export interface ContactDeliveryConfig {
  hasSanityWriteToken: boolean
  hasResendApiKey: boolean
  hasContactEmailTo: boolean
}

export interface ContactDeliveryPlan {
  /** Whether to attempt saving the submission to Sanity. */
  persistToSanity: boolean
  /** Whether to attempt an email notification via Resend. */
  sendEmail: boolean
  /** True if at least one delivery method is available. False means the
   * route should skip both I/O attempts entirely — with no token and no
   * email configured, a Sanity write would only fail every time. */
  configured: boolean
}

/**
 * Decides which contact-form delivery methods are actually usable, purely
 * from which optional env vars are set — no I/O. Keeping this a pure
 * function means the "nothing configured" case is testable without a
 * live Sanity/Resend call, and the route handler never attempts a write
 * it already knows will fail.
 */
export function planContactDelivery(config: ContactDeliveryConfig): ContactDeliveryPlan {
  const persistToSanity = config.hasSanityWriteToken
  const sendEmail = config.hasResendApiKey && config.hasContactEmailTo
  return { persistToSanity, sendEmail, configured: persistToSanity || sendEmail }
}
