import { describe, expect, it } from 'vitest'
import { getClient, skipIfNoEnv } from './setup'

describe.skipIf(skipIfNoEnv())('Team (integration)', () => {
  it('listMembers() returns team members', async () => {
    const client = getClient()
    const members = await client.team.listMembers()

    expect(Array.isArray(members)).toBe(true)
    expect(members.length).toBeGreaterThan(0)
    expect(members[0]).toHaveProperty('userId')
    expect(members[0]).toHaveProperty('email')
    expect(members[0]).toHaveProperty('roles')
  })
})
