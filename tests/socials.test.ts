import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSocialsNamespace } from '../src/socials'
import { createMockFetch } from './mock-fetch'

const ENDPOINT = 'http://localhost:8787'
const API_KEY = 'sapt_test123'

describe('SocialsNamespace', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('createConnectLink() sends correct POST body', async () => {
    const mockResponse = {
      connectUrl: 'http://localhost:8787/socials/connect/abc123',
      sessionId: 'session-uuid',
      expiresAt: '2026-03-15T12:30:00Z',
    }
    const { fetch: mockFetch, requests } = createMockFetch([
      { method: 'POST', path: '/socials/connect', body: mockResponse },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const socials = createSocialsNamespace(ENDPOINT, API_KEY)
    const result = await socials.createConnectLink({
      projectId: 'proj-1',
      platform: 'meta',
      redirectUrl: 'https://myapp.com/callback',
    })

    expect(result).toEqual(mockResponse)
    expect(requests[0].method).toBe('POST')
    expect(requests[0].body).toEqual({
      projectId: 'proj-1',
      platform: 'meta',
      redirectUrl: 'https://myapp.com/callback',
    })
  })

  it('getConnectStatus() polls session by ID', async () => {
    const mockStatus = {
      sessionId: 'session-1',
      status: 'completed',
      accounts: [
        { id: 'acc-1', platform: 'instagram', username: 'mybiz', displayName: 'My Biz', profilePictureUrl: null },
      ],
      error: null,
      expiresAt: '2026-03-15T12:30:00Z',
      completedAt: '2026-03-15T12:05:00Z',
    }
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: '/socials/connect-status/session-1', body: mockStatus },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const socials = createSocialsNamespace(ENDPOINT, API_KEY)
    const result = await socials.getConnectStatus('session-1')

    expect(result.status).toBe('completed')
    expect(result.accounts).toHaveLength(1)
    expect(result.accounts![0].username).toBe('mybiz')
    expect(requests[0].url).toContain('/socials/connect-status/session-1')
  })

  it('listAccounts() returns accounts for a project', async () => {
    const mockAccounts = [
      { id: 'a1', platform: 'instagram', username: 'mybiz', displayName: 'My Biz', profilePictureUrl: null, profileUrl: null, followersCount: 1000, isActive: true },
    ]
    const { fetch: mockFetch } = createMockFetch([
      { path: '/socials/accounts/proj-1', body: { success: true, data: { accounts: mockAccounts } } },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const socials = createSocialsNamespace(ENDPOINT, API_KEY)
    const accounts = await socials.listAccounts('proj-1')

    expect(accounts).toHaveLength(1)
    expect(accounts[0].username).toBe('mybiz')
    expect(accounts[0].followersCount).toBe(1000)
  })
})
