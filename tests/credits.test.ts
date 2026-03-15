import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createCreditsNamespace } from '../src/credits'
import { createMockFetch } from './mock-fetch'

const ENDPOINT = 'http://localhost:8787'
const API_KEY = 'sapt_test123'
const PROJECT_ID = 'proj-1'

describe('CreditsNamespace', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('getBalance() returns credit balance', async () => {
    const mockBalance = { credits: 42.5, balanceMicro: '42500000', updatedAt: '2026-03-15T12:00:00Z' }
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: `/projects/${PROJECT_ID}/credits`, body: mockBalance },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const credits = createCreditsNamespace(ENDPOINT, API_KEY, PROJECT_ID)
    const result = await credits.getBalance(PROJECT_ID)

    expect(result.credits).toBe(42.5)
    expect(requests[0].url).toContain(`/projects/${PROJECT_ID}/credits`)
  })

  it('getTransactions() sends pagination params', async () => {
    const mockTransactions = [
      { id: 't1', type: 'initial_grant', credits: 10, balanceAfterCredits: 10, description: 'Initial', createdAt: '2026-03-15T00:00:00Z' },
    ]
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: `/projects/${PROJECT_ID}/credits/transactions`, body: { transactions: mockTransactions } },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const credits = createCreditsNamespace(ENDPOINT, API_KEY, PROJECT_ID)
    const result = await credits.getTransactions(PROJECT_ID, { limit: 5, offset: 10 })

    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('initial_grant')
    expect(requests[0].url).toContain('limit=5')
    expect(requests[0].url).toContain('offset=10')
  })
})
