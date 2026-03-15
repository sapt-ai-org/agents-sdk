import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SaptApiError } from '../src/errors'
import { createProjectsNamespace } from '../src/projects'
import { createMockFetch } from './mock-fetch'

const ENDPOINT = 'http://localhost:8787'
const API_KEY = 'sapt_test123'

describe('Error handling', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('parses structured error format { error: { code, message, details } }', async () => {
    const { fetch: mockFetch } = createMockFetch([
      {
        path: '/projects',
        status: 404,
        body: {
          error: {
            code: 'NOT_FOUND',
            message: 'Project not found',
            details: { resourceType: 'project', resourceId: 'p-missing' },
          },
        },
      },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)

    try {
      await projects.list()
      expect.fail('Should have thrown')
    } catch (err) {
      expect(err).toBeInstanceOf(SaptApiError)
      const e = err as SaptApiError
      expect(e.code).toBe('NOT_FOUND')
      expect(e.message).toBe('Project not found')
      expect(e.status).toBe(404)
      expect(e.details.resourceType).toBe('project')
      expect(e.details.resourceId).toBe('p-missing')
    }
  })

  it('parses legacy error format { message, code }', async () => {
    const { fetch: mockFetch } = createMockFetch([
      {
        path: '/projects',
        status: 403,
        body: { message: 'Access denied', code: 'FORBIDDEN' },
      },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)

    try {
      await projects.list()
      expect.fail('Should have thrown')
    } catch (err) {
      const e = err as SaptApiError
      expect(e.status).toBe(403)
      expect(e.message).toBe('Access denied')
      expect(e.code).toBe('FORBIDDEN')
    }
  })

  it('handles rate limit with Retry-After header', async () => {
    const { fetch: mockFetch } = createMockFetch([
      {
        path: '/projects',
        status: 429,
        body: {
          error: { code: 'RATE_LIMITED', message: 'Too many requests' },
        },
        headers: { 'Retry-After': '30' },
      },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)

    try {
      await projects.list()
      expect.fail('Should have thrown')
    } catch (err) {
      const e = err as SaptApiError
      expect(e.code).toBe('RATE_LIMITED')
      expect(e.status).toBe(429)
      expect(e.retryAfter).toBe(30)
    }
  })

  it('handles insufficient credits with details', async () => {
    const { fetch: mockFetch } = createMockFetch([
      {
        path: '/projects',
        status: 402,
        body: {
          error: {
            code: 'INSUFFICIENT_CREDITS',
            message: 'Not enough credits',
            details: { required: 10, available: 2 },
          },
        },
      },
    ])
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch

    const projects = createProjectsNamespace(ENDPOINT, API_KEY)

    try {
      await projects.list()
      expect.fail('Should have thrown')
    } catch (err) {
      const e = err as SaptApiError
      expect(e.code).toBe('INSUFFICIENT_CREDITS')
      expect(e.details.required).toBe(10)
      expect(e.details.available).toBe(2)
    }
  })
})
