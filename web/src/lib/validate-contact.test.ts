import { describe, expect, it } from 'vitest'
import { validateContact } from './validate-contact'

const validInput = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello, I would like to work with you.',
  honeypot: '',
}

describe('validateContact', () => {
  it('accepts a fully valid submission', () => {
    const result = validateContact(validInput)
    expect(result).toEqual({
      valid: true,
      data: { name: 'Ada Lovelace', email: 'ada@example.com', message: 'Hello, I would like to work with you.' },
    })
  })

  it('rejects a submission with a filled honeypot field as spam', () => {
    const result = validateContact({ ...validInput, honeypot: 'http://spam.example' })
    expect(result.valid).toBe(false)
  })

  it('rejects an empty name', () => {
    const result = validateContact({ ...validInput, name: '  ' })
    expect(result).toEqual({ valid: false, errors: { name: 'Name is required' } })
  })

  it('rejects an invalid email', () => {
    const result = validateContact({ ...validInput, email: 'not-an-email' })
    expect(result).toEqual({ valid: false, errors: { email: 'Enter a valid email address' } })
  })

  it('rejects a message that is too short', () => {
    const result = validateContact({ ...validInput, message: 'hi' })
    expect(result).toEqual({ valid: false, errors: { message: 'Message must be at least 10 characters' } })
  })

  it('trims whitespace from accepted fields', () => {
    const result = validateContact({ ...validInput, name: '  Ada Lovelace  ' })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.data.name).toBe('Ada Lovelace')
  })
})
