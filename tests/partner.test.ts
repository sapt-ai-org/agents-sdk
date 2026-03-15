import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPartnerNamespace } from '../src/partner'
import { createMockFetch } from './mock-fetch'

const ENDPOINT = 'http://localhost:8787'
const API_KEY = 'sapt_partner_key'

describe('PartnerNamespace', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getCreditBalance() returns partner pool balance', async () => {
    const mockBalance = { balanceMicro: 100000000, balanceCredits: 100 }
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: '/partner/credits', body: mockBalance },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const partner = createPartnerNamespace(ENDPOINT, API_KEY)
    const result = await partner.getCreditBalance()

    expect(result.balanceCredits).toBe(100)
    expect(result.balanceMicro).toBe(100000000)
    expect(requests[0].url).toContain('/partner/credits')
    expect(requests[0].headers.Authorization).toBe(`ApiKey ${API_KEY}`)
  })
})
