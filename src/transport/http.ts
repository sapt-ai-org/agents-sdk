import { SaptApiError } from '../errors'
import type { AgentChunk, ServerMessage } from '../types'

async function extractError(
  res: Response,
  fallback: string
): Promise<{ message: string; code?: string; details?: Record<string, unknown> }> {
  try {
    const body = (await res.json()) as {
      // New structured format: { error: { code, message, details } }
      error?: string | { code?: string; name?: string; message?: string; details?: Record<string, unknown> }
      message?: string
      code?: string
    }
    if (typeof body.error === 'object' && body.error !== null) {
      return {
        message: body.error.message ?? body.error.name ?? fallback,
        code: body.error.code ?? body.code,
        details: body.error.details,
      }
    }
    return {
      message: body.error ?? body.message ?? fallback,
      code: body.code,
    }
  } catch {
    return { message: fallback }
  }
}

/**
 * Builds a query string from an object of key-value pairs.
 * Omits undefined/null values. Returns '' if no params, or '?key=val&...' otherwise.
 */
export function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

/**
 * Makes an authenticated JSON request to the Sapt API.
 * Throws on non-2xx responses with error detail from the response body when available.
 */
export async function apiFetch<T>(
  endpoint: string,
  apiKey: string,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${endpoint}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${apiKey}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const { message, code, details } = await extractError(res, `${res.status} ${res.statusText}`)
    const retryAfter =
      res.status === 429
        ? parseRetryAfter(res.headers.get('Retry-After'))
        : undefined
    throw new SaptApiError(message, res.status, code, details, retryAfter)
  }

  return res.json() as Promise<T>
}

/**
 * Streams an SSE response from the Sapt API, yielding typed AgentChunk objects.
 *
 * The server sends newline-delimited `data: <json>` lines (standard SSE).
 * Each data line is parsed as a ServerMessage and mapped to AgentChunk.
 * `status` and `pong` messages are skipped — they are transport-level signals.
 */
export async function* sseStream(
  endpoint: string,
  apiKey: string,
  path: string,
  body: unknown
): AsyncIterable<AgentChunk> {
  const res = await fetch(`${endpoint}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `ApiKey ${apiKey}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const { message, code, details } = await extractError(res, `${res.status} ${res.statusText}`)
    const retryAfter =
      res.status === 429
        ? parseRetryAfter(res.headers.get('Retry-After'))
        : undefined
    throw new SaptApiError(message, res.status, code, details, retryAfter)
  }

  if (!res.body) {
    throw new SaptApiError('Response has no body', 502)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // Keep the last (potentially incomplete) line in the buffer
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue

        const data = trimmed.slice(5).trim()
        if (!data || data === '[DONE]') continue

        let msg: ServerMessage
        try {
          msg = JSON.parse(data) as ServerMessage
        } catch {
          continue
        }

        const chunk = serverMessageToChunk(msg)
        if (chunk !== null) {
          yield chunk
        }
      }
    }
  } finally {
    void reader.cancel()
  }
}

/**
 * Maps a ServerMessage to an AgentChunk, or null if the message type
 * is transport-level and should not be surfaced to callers.
 */
function serverMessageToChunk(msg: ServerMessage): AgentChunk | null {
  switch (msg.type) {
    case 'agent_chunk':
      return { type: 'text', content: msg.content, runId: msg.runId }
    case 'tool_start':
      return {
        type: 'tool_start',
        toolSlug: msg.toolSlug,
        toolInput: msg.toolInput,
        runId: msg.runId,
      }
    case 'tool_end':
      return {
        type: 'tool_end',
        toolSlug: msg.toolSlug,
        toolResult: msg.toolResult,
        runId: msg.runId,
      }
    case 'pending_action':
      return {
        type: 'pending_action',
        pendingActionId: msg.pendingActionId,
        actionSlug: msg.actionSlug,
        description: msg.description,
        actionInput: msg.actionInput,
        runId: msg.runId,
      }
    case 'done':
      return { type: 'done', conversationId: msg.conversationId, runId: msg.runId }
    case 'error':
      return { type: 'error', error: msg.error, runId: msg.runId }
    // status, connected, pong are transport-level — not surfaced via SSE
    default:
      return null
  }
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  const seconds = Number(header)
  return Number.isFinite(seconds) ? seconds : undefined
}
