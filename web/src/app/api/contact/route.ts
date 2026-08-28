import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { env } from '@/lib/env'
import { validateContact, type ContactFormInput } from '@/lib/validate-contact'
import { planContactDelivery } from '@/lib/contact-delivery'
import { writeClient } from '@/sanity/write-client'

export async function POST(request: Request) {
  let body: Partial<ContactFormInput>
  try {
    const parsed: unknown = await request.json()
    // A syntactically valid JSON body can still be `null`, a number, or an
    // array — request.json() won't throw for those, but treating them as
    // ContactFormInput below would throw on `body.name`. Reject anything
    // that isn't a plain object up front.
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Body must be a JSON object')
    }
    body = parsed as Partial<ContactFormInput>
  } catch {
    return NextResponse.json({ ok: false, errors: { form: 'Invalid request body' } }, { status: 400 })
  }

  const result = validateContact({
    name: body.name ?? '',
    email: body.email ?? '',
    message: body.message ?? '',
    honeypot: body.honeypot ?? '',
  })

  if (!result.valid) {
    return NextResponse.json({ ok: false, errors: result.errors }, { status: 400 })
  }

  const { name, email, message } = result.data

  const plan = planContactDelivery({
    hasSanityWriteToken: Boolean(env.sanityWriteToken),
    hasResendApiKey: Boolean(env.resendApiKey),
    hasContactEmailTo: Boolean(env.contactEmailTo),
  })

  // Neither delivery method is configured — a Sanity write would fail on
  // every submission (no auth token), so don't even attempt it. This is a
  // site-owner config gap, not a runtime error; log it once for them and
  // tell the visitor honestly rather than pretending the message arrived.
  if (!plan.configured) {
    console.warn(
      'Contact form submission received but no delivery method is configured ' +
        '(set SANITY_API_WRITE_TOKEN, or RESEND_API_KEY + CONTACT_EMAIL_TO — see README.md "Environment variables").',
    )
    return NextResponse.json(
      { ok: false, errors: { form: 'This form is not fully set up yet. Please try again later.' } },
      { status: 503 },
    )
  }

  if (plan.persistToSanity) {
    try {
      await writeClient.create({
        _type: 'contactSubmission',
        name,
        email,
        message,
        submittedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to save contact submission to Sanity', error)
      return NextResponse.json({ ok: false, errors: { form: 'Something went wrong. Please try again.' } }, { status: 500 })
    }
  }

  if (plan.sendEmail) {
    try {
      const resend = new Resend(env.resendApiKey)
      await resend.emails.send({
        from: 'Portfolio Contact Form <onboarding@resend.dev>',
        to: env.contactEmailTo!,
        replyTo: email,
        subject: `New portfolio message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      })
    } catch (error) {
      // If Sanity persistence also ran, the submission is already saved —
      // log but don't fail the request just because the email didn't send.
      // If email was the only configured method, the visitor does need to
      // know their message didn't get through.
      console.error('Failed to send contact notification email', error)
      if (!plan.persistToSanity) {
        return NextResponse.json({ ok: false, errors: { form: 'Something went wrong. Please try again.' } }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
