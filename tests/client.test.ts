import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSaptAgentClient } from '../src/client'
import { createMockFetch } from './mock-fetch'

describe('createSaptAgentClient', () => {
  it('throws if no apiKey or endpoint', () => {
    expect(() => createSaptAgentClient({ projectId: 'p', apiKey: '', endpoint: 'http://x' })).toThrow('apiKey is required')
    expect(() => createSaptAgentClient({ projectId: 'p', apiKey: 'k', endpoint: '' })).toThrow('endpoint is required')
    expect(() => createSaptAgentClient({ projectId: '', apiKey: 'k', endpoint: 'http://x' })).toThrow('projectId is required')
  })

  it('creates a client with all namespaces', () => {
    const client = createSaptAgentClient({ projectId: 'p', apiKey: 'sapt_test', endpoint: 'http://localhost' })
    expect(client.agents).toBeDefined()
    expect(client.memory).toBeDefined()
    expect(client.actions).toBeDefined()
    expect(client.projects).toBeDefined()
    expect(client.team).toBeDefined()
    expect(client.socials).toBeDefined()
    expect(client.credits).toBeDefined()
    expect(typeof client.run).toBe('function')
    expect(typeof client.stream).toBe('function')
    expect(typeof client.conversation).toBe('function')
  })
})
