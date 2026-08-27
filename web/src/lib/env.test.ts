import { afterEach, describe, expect, it, vi } from 'vitest'

// The env module validates required vars at import time, so each test needs
// a fresh module instance to observe how it reacts to a given process.env.
function importEnv() {
  vi.resetModules()
  return import('./env')
}

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', undefined)
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')

    await expect(importEnv()).rejects.toThrow('NEXT_PUBLIC_SANITY_PROJECT_ID')
  })

  it('throws when NEXT_PUBLIC_SANITY_DATASET is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'abc123')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', undefined)

    await expect(importEnv()).rejects.toThrow('NEXT_PUBLIC_SANITY_DATASET')
  })

  it('exposes the required Sanity values when both are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'abc123')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')

    const { env } = await importEnv()

    expect(env.sanityProjectId).toBe('abc123')
    expect(env.sanityDataset).toBe('production')
  })

  it('exposes optional values as undefined when unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'abc123')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
    vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', undefined)
    vi.stubEnv('NEXT_PUBLIC_UMAMI_SCRIPT_URL', undefined)

    const { env } = await importEnv()

    expect(env.umamiWebsiteId).toBeUndefined()
    expect(env.umamiScriptUrl).toBeUndefined()
  })

  it('exposes optional values when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'abc123')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
    vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', 'test-website-id')
    vi.stubEnv('NEXT_PUBLIC_UMAMI_SCRIPT_URL', 'https://umami.example.com/script.js')

    const { env } = await importEnv()

    expect(env.umamiWebsiteId).toBe('test-website-id')
    expect(env.umamiScriptUrl).toBe('https://umami.example.com/script.js')
  })
})
