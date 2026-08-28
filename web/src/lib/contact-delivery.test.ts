import { describe, expect, it } from 'vitest'
import { planContactDelivery } from './contact-delivery'

describe('planContactDelivery', () => {
  it('plans both persistence and email when everything is configured', () => {
    const plan = planContactDelivery({ hasSanityWriteToken: true, hasResendApiKey: true, hasContactEmailTo: true })
    expect(plan).toEqual({ persistToSanity: true, sendEmail: true, configured: true })
  })

  it('plans persistence only when just the Sanity write token is set', () => {
    const plan = planContactDelivery({ hasSanityWriteToken: true, hasResendApiKey: false, hasContactEmailTo: false })
    expect(plan).toEqual({ persistToSanity: true, sendEmail: false, configured: true })
  })

  it('plans email only when just Resend is fully configured', () => {
    const plan = planContactDelivery({ hasSanityWriteToken: false, hasResendApiKey: true, hasContactEmailTo: true })
    expect(plan).toEqual({ persistToSanity: false, sendEmail: true, configured: true })
  })

  it('requires both the Resend key and the destination address for email', () => {
    const plan = planContactDelivery({ hasSanityWriteToken: false, hasResendApiKey: true, hasContactEmailTo: false })
    expect(plan).toEqual({ persistToSanity: false, sendEmail: false, configured: false })
  })

  it('reports not configured when nothing is set, so the caller never attempts a doomed write', () => {
    const plan = planContactDelivery({ hasSanityWriteToken: false, hasResendApiKey: false, hasContactEmailTo: false })
    expect(plan).toEqual({ persistToSanity: false, sendEmail: false, configured: false })
  })
})
