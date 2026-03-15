import { describe, expect, it } from 'vitest'
import { getClient, requireEnv, skipIfNoEnv } from './setup'

// REST endpoints /projects/{id}/credits and /projects/{id}/credits/transactions
// are not yet deployed — skip until they exist
describe.skip('Credits (integration)', () => {
  it('getBalance() returns credit balance', async () => {
    const client = getClient()
    const projectId = requireEnv('SAPT_PROJECT_ID')

    const balance = await client.credits.getBalance(projectId)

    expect(balance).toHaveProperty('credits')
    expect(typeof balance.credits).toBe('number')
    expect(balance).toHaveProperty('balanceMicro')
  })

  it('getTransactions() returns transaction history', async () => {
    const client = getClient()
    const projectId = requireEnv('SAPT_PROJECT_ID')

    const transactions = await client.credits.getTransactions(projectId, { limit: 5 })

    expect(Array.isArray(transactions)).toBe(true)
    if (transactions.length > 0) {
      expect(transactions[0]).toHaveProperty('id')
      expect(transactions[0]).toHaveProperty('type')
      expect(transactions[0]).toHaveProperty('credits')
      expect(transactions[0]).toHaveProperty('createdAt')
    }
  })
})
