import { vi } from 'vitest'

interface MockRoute {
  method?: string
  path: string | RegExp
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

/**
 * Creates a mock fetch that intercepts requests and returns configured responses.
 * Also captures all requests for assertion.
 */
export function createMockFetch(routes: MockRoute[]) {
  const requests: Array<{ url: string; method: string; headers: Record<string, string>; body: unknown }> = []

  const mockFn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const method = (init?.method ?? 'GET').toUpperCase()

    let parsedBody: unknown = undefined
    if (init?.body && typeof init.body === 'string') {
      try {
        parsedBody = JSON.parse(init.body)
      } catch {
        parsedBody = init.body
      }
    }

    const headers: Record<string, string> = {}
    if (init?.headers) {
      const h = init.headers as Record<string, string>
      for (const [k, v] of Object.entries(h)) {
        headers[k] = v
      }
    }

    requests.push({ url, method, headers, body: parsedBody })

    // Find matching route
    const route = routes.find((r) => {
      const methodMatch = !r.method || r.method.toUpperCase() === method
      const pathMatch =
        r.path instanceof RegExp ? r.path.test(url) : url.includes(r.path)
      return methodMatch && pathMatch
    })

    if (!route) {
      return new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'No mock route matched' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(route.body ?? {}), {
      status: route.status ?? 200,
      headers: {
        'Content-Type': 'application/json',
        ...(route.headers ?? {}),
      },
    })
  })

  return { fetch: mockFn, requests }
}
