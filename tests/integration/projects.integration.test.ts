import { describe, expect, it } from 'vitest'
import { SaptApiError } from '../../src/errors'
import { getClient, skipIfNoEnv } from './setup'

describe.skipIf(skipIfNoEnv())('Projects (integration)', () => {
  it('list() returns an array of projects', async () => {
    const client = getClient()
    const projects = await client.projects.list()

    expect(Array.isArray(projects)).toBe(true)
    if (projects.length > 0) {
      expect(projects[0]).toHaveProperty('id')
      expect(projects[0]).toHaveProperty('name')
      expect(projects[0]).toHaveProperty('slug')
      expect(projects[0]).toHaveProperty('plan')
    }
  })

  it('get() returns a single project', async () => {
    const client = getClient()
    const projects = await client.projects.list()
    expect(projects.length).toBeGreaterThan(0)

    const project = await client.projects.get(projects[0].id)
    expect(project.id).toBe(projects[0].id)
    expect(project.name).toBe(projects[0].name)
  })

  it('get() throws NOT_FOUND for invalid ID', async () => {
    const client = getClient()

    try {
      await client.projects.get('00000000-0000-0000-0000-000000000000')
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SaptApiError)
      const e = err as SaptApiError
      expect(e.status).toBeGreaterThanOrEqual(400)
    }
  })
})
