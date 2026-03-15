import { describe, expect, it } from 'vitest'
import { SaptApiError } from '../../src/errors'
import type { AgentDefinition } from '../../src/types'
import { getClient, skipIfNoEnv } from './setup'

describe.skipIf(skipIfNoEnv())('Agents CRUD (integration)', () => {
  let createdAgentId: string | null = null

  it('list() returns paginated agents', async () => {
    const client = getClient()
    const result = await client.agents.list({ limit: 5 })

    expect(result.items).toBeDefined()
    expect(Array.isArray(result.items)).toBe(true)
    expect(result.pagination).toBeDefined()
    expect(result.pagination.limit).toBe(5)
  })

  it('create() creates an agent definition', async () => {
    const client = getClient()
    const agent = await client.agents.create({
      name: `SDK Test Agent ${Date.now()}`,
      description: 'Created by integration test — safe to delete',
      systemPrompt: 'You are a test agent. Respond with "test passed".',
      toolCategories: [],
    })

    expect(agent.id).toBeDefined()
    expect(agent.name).toContain('SDK Test Agent')
    expect(agent.systemPrompt).toBe('You are a test agent. Respond with "test passed".')
    createdAgentId = agent.id
  })

  it('get() returns the created agent', async () => {
    expect(createdAgentId).not.toBeNull()
    const client = getClient()
    const agent = await client.agents.get(createdAgentId!)

    expect(agent.id).toBe(createdAgentId)
    expect(agent.description).toContain('integration test')
  })

  it('update() modifies agent fields', async () => {
    expect(createdAgentId).not.toBeNull()
    const client = getClient()
    const updated = await client.agents.update(createdAgentId!, {
      description: 'Updated by integration test',
      maxSteps: 3,
    })

    expect(updated.description).toBe('Updated by integration test')
    expect(updated.maxSteps).toBe(3)
  })

  it('delete() removes the agent', async () => {
    expect(createdAgentId).not.toBeNull()
    const client = getClient()
    await client.agents.delete(createdAgentId!)

    // Verify it's gone
    try {
      await client.agents.get(createdAgentId!)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SaptApiError)
    }

    createdAgentId = null
  })
})
