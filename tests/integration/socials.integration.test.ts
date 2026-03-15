import { describe, expect, it } from 'vitest'
import { SaptApiError } from '../../src/errors'
import { getClient, requireEnv, skipIfNoEnv } from './setup'

describe.skipIf(skipIfNoEnv())('Socials (integration)', () => {
  it('createConnectLink() returns a connect URL and session ID', async () => {
    const client = getClient()
    const projectId = requireEnv('SAPT_PROJECT_ID')

    const link = await client.socials.createConnectLink({
      projectId,
      platform: 'meta',
    })

    expect(link.connectUrl).toBeDefined()
    expect(link.connectUrl).toContain('/socials/connect/')
    expect(link.sessionId).toBeDefined()
    expect(link.expiresAt).toBeDefined()
    // Verify expiry is ~30 min in the future
    const expiresAt = new Date(link.expiresAt)
    const now = new Date()
    const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60)
    expect(diffMinutes).toBeGreaterThan(25)
    expect(diffMinutes).toBeLessThan(35)
  })

  it('getConnectStatus() returns pending for a fresh session', async () => {
    const client = getClient()
    const projectId = requireEnv('SAPT_PROJECT_ID')

    const link = await client.socials.createConnectLink({
      projectId,
      platform: 'meta',
    })

    const status = await client.socials.getConnectStatus(link.sessionId)

    expect(status.sessionId).toBe(link.sessionId)
    expect(status.status).toBe('pending')
    expect(status.accounts).toBeNull()
    expect(status.error).toBeNull()
  })

  it('listAccounts() returns accounts array', async () => {
    const client = getClient()
    const projectId = requireEnv('SAPT_PROJECT_ID')

    const accounts = await client.socials.listAccounts(projectId)

    expect(Array.isArray(accounts)).toBe(true)
    // May be empty if no accounts connected — that's fine
    if (accounts.length > 0) {
      expect(accounts[0]).toHaveProperty('id')
      expect(accounts[0]).toHaveProperty('platform')
      expect(accounts[0]).toHaveProperty('username')
      expect(accounts[0]).toHaveProperty('isActive')
    }
  })
})
