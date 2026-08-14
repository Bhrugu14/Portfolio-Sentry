import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { env } from '@/lib/env'
import { validateContact, type ContactFormInput } from '@/lib/validate-contact'
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

  const resendApiKey = env.resendApiKey
  const to = env.contactEmailTo

  if (resendApiKey && to) {
    try {
      const resend = new Resend(resendApiKey)
      await resend.emails.send({
        from: 'Portfolio Contact Form <onboarding@resend.dev>',
        to,
        replyTo: email,
        subject: `New portfolio message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      })
    } catch (error) {
      // The submission is already saved in Sanity — log but don't fail the
      // request just because the email notification didn't send.
      console.error('Failed to send contact notification email', error)
    }
  }

  return NextResponse.json({ ok: true })
}
