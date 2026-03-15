import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createProjectsNamespace } from '../src/projects'
import { createMockFetch } from './mock-fetch'

const ENDPOINT = 'http://localhost:8787'
const API_KEY = 'sapt_test123'

describe('ProjectsNamespace', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('list() sends correct auth header and returns projects', async () => {
    const mockProjects = [
      { id: 'p1', name: 'Project 1', slug: 'project-1', type: 'other', plan: 'free', createdAt: '2026-01-01T00:00:00Z' },
    ]
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: '/projects', body: { projects: mockProjects } },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)
    const result = await projects.list()

    expect(result).toEqual(mockProjects)
    expect(requests[0].headers.Authorization).toBe(`ApiKey ${API_KEY}`)
    expect(requests[0].method).toBe('GET')
    expect(requests[0].url).toBe(`${ENDPOINT}/projects`)
  })

  it('get() fetches a single project by ID', async () => {
    const mockProject = { id: 'p1', name: 'Project 1', slug: 'project-1' }
    const { fetch: mockFetch, requests } = createMockFetch([
      { path: '/projects/p1', body: { project: mockProject } },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)
    const result = await projects.get('p1')

    expect(result).toEqual(mockProject)
    expect(requests[0].url).toBe(`${ENDPOINT}/projects/p1`)
  })
})
