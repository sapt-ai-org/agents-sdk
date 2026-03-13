import type { AgentChunk, ServerMessage } from '../types'

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string }
    return body.error ?? body.message ?? fallback
  } catch {
    return fallback
  }
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
    const message = await extractErrorMessage(res, `${res.status} ${res.statusText}`)
    throw new Error(message)
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
    const message = await extractErrorMessage(res, `${res.status} ${res.statusText}`)
    throw new Error(message)
  }

  if (!res.body) {
    throw new Error('Response has no body')
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
