import { describe, expect, it } from 'vitest'
import { SaptApiError } from '../../src/errors'
import { getClient, skipIfNoEnv } from './setup'

describe.skipIf(skipIfNoEnv())('Memory CRUD (integration)', () => {
  const testSlug = `sdk-test-${Date.now()}`
  let createdSlug: string | null = null

  it('create() creates a memory entry', async () => {
    const client = getClient()
    const entry = await client.memory.create({
      slug: testSlug,
      title: 'SDK Test Entry',
      description: 'Created by integration test — safe to delete',
      content: 'This is test content for the memory entry.',
    })

    expect(entry.slug).toBe(testSlug)
    expect(entry.title).toBe('SDK Test Entry')
    expect(entry.content).toBe('This is test content for the memory entry.')
    createdSlug = entry.slug
  })

  it('list() includes the created entry', async () => {
    const client = getClient()
    const result = await client.memory.list({ limit: 50 })

    expect(result.items).toBeDefined()
    const found = result.items.find((e) => e.slug === testSlug)
    expect(found).toBeDefined()
    expect(found!.title).toBe('SDK Test Entry')
  })

  it('get() returns the entry with content', async () => {
    expect(createdSlug).not.toBeNull()
    const client = getClient()
    const entry = await client.memory.get(createdSlug!)

    expect(entry.slug).toBe(createdSlug)
    expect(entry.content).toBe('This is test content for the memory entry.')
  })

  it('update() modifies the entry', async () => {
    expect(createdSlug).not.toBeNull()
    const client = getClient()
    const updated = await client.memory.update(createdSlug!, {
      title: 'Updated SDK Test Entry',
      content: 'Updated content.',
    })

    expect(updated.title).toBe('Updated SDK Test Entry')
    expect(updated.content).toBe('Updated content.')
  })

  it('delete() removes the entry', async () => {
    expect(createdSlug).not.toBeNull()
    const client = getClient()
    await client.memory.delete(createdSlug!)

    try {
      await client.memory.get(createdSlug!)
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SaptApiError)
    }

    createdSlug = null
  })
})
