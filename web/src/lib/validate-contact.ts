export type ContactFormInput = {
  name: string
  email: string
  message: string
  honeypot: string
}

export type ContactValidationResult =
  | { valid: true; data: { name: string; email: string; message: string } }
  | { valid: false; errors: Partial<Record<'name' | 'email' | 'message', string>> }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateContact(input: ContactFormInput): ContactValidationResult {
  // Honeypot: real users never fill this hidden field. Treat any value as
  // spam and reject without leaking which check failed.
  if (input.honeypot.trim() !== '') {
    return { valid: false, errors: { name: 'Submission rejected' } }
  }

  const name = input.name.trim()
  const email = input.email.trim()
  const message = input.message.trim()
  const errors: Partial<Record<'name' | 'email' | 'message', string>> = {}

  if (name.length === 0) errors.name = 'Name is required'
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address'
  if (message.length < 10) errors.message = 'Message must be at least 10 characters'

  if (Object.keys(errors).length > 0) return { valid: false, errors }

  return { valid: true, data: { name, email, message } }
}
