import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

describe('GET /api/version', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns the GIT_SHA environment value', async () => {
    vi.stubEnv('GIT_SHA', 'abc1234')
    const res = GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sha: 'abc1234' })
  })

  it('falls back to "unknown" when GIT_SHA is not set', async () => {
    vi.stubEnv('GIT_SHA', undefined)
    const res = GET()
    expect(await res.json()).toEqual({ sha: 'unknown' })
  })
})
