'use client'

import { useState, type FormEvent } from 'react'
import type { SITE_SETTINGS_QUERY_RESULT } from '../../../sanity.types'

type Status = 'idle' | 'submitting' | 'success' | 'error'

const SOCIAL_LABELS: Record<string, string> = {
  github: 'GitHub',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
  email: 'Email',
  other: 'Link',
}

export function Contact({ settings }: { settings: NonNullable<SITE_SETTINGS_QUERY_RESULT> }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus('submitting')
    setErrors({})

    const form = new FormData(event.currentTarget)
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      honeypot: String(form.get('company') || ''),
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json()

      if (!res.ok || !body.ok) {
        setStatus('error')
        setErrors(body.errors || {})
        return
      }

      setStatus('success')
      event.currentTarget.reset()
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-2xl px-6 py-16">
      <h2 className="mb-10 text-sm font-semibold uppercase tracking-widest text-accent">Contact</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Honeypot: hidden from real users via CSS, bots often fill every field */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="absolute left-[-9999px]"
          aria-hidden="true"
        />
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-accent"
          />
          {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
        </div>
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>
        {status === 'success' && <p className="text-sm text-emerald-600 dark:text-emerald-400">Thanks — I&apos;ll get back to you soon.</p>}
        {status === 'error' && Object.keys(errors).length === 0 && (
          <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
        )}
      </form>
      {settings.socialLinks && settings.socialLinks.length > 0 && (
        <ul className="mt-10 flex flex-wrap gap-4 text-sm">
          {settings.socialLinks.map((link) => (
            <li key={link._key}>
              <a href={link.url ?? undefined} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent">
                {SOCIAL_LABELS[link.platform ?? 'other'] ?? link.platform}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
