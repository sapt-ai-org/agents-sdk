import { exchangeApiKeyForWsToken } from './transport/auth'
import { apiFetch } from './transport/http'
import { ManagedWebSocket } from './transport/websocket'
import type { ConversationChunk, ConversationOptions } from './types'

/**
 * A multi-turn WebSocket conversation session.
 *
 * Obtain one via sapt.conversation(agentId, options).
 * Each call to stream() sends a message and yields chunks until done or error.
 * Call close() when finished.
 */
export interface Conversation {
  /**
   * The conversationId assigned by the server.
   * Populated after the first 'connected' chunk is received.
   * Pass this to sapt.conversation(agentId, { conversationId }) to resume.
   */
  readonly conversationId: string | null

  /**
   * Send a message and stream the response.
   * Yields chunks until a 'done' or 'error' chunk is received.
   * Waits for the WebSocket to connect if not already open.
   */
  stream(message: string): AsyncIterable<ConversationChunk>

  /**
   * Approve a pending action via REST.
   */
  approveAction(actionId: string): Promise<void>

  /**
   * Reject a pending action via REST.
   */
  rejectAction(actionId: string, reason?: string): Promise<void>

  /** Close the WebSocket connection permanently. */
  close(): void
}

/** @internal Creates a Conversation instance. Called by {@link SaptAgentClient.conversation}. */
export function createConversation(
  endpoint: string,
  apiKey: string,
  agentId: string,
  options: ConversationOptions = {}
): Conversation {
  let conversationId: string | null = options.conversationId ?? null

  // Build the WSS URL, exchanging the API key for a short-lived JWT each time.
  // On reconnect, a fresh token is fetched automatically.
  async function buildUrl(): Promise<string> {
    const token = await exchangeApiKeyForWsToken(endpoint, apiKey)
    const wsEndpoint = endpoint.replace(/^http/, 'ws')
    const path = conversationId
      ? `/agents/${agentId}/ws/${conversationId}`
      : `/agents/${agentId}/ws`
    return `${wsEndpoint}${path}?token=${encodeURIComponent(token)}`
  }

  const socket = new ManagedWebSocket(buildUrl)

  // Initiate connection eagerly so the handshake is in-flight before stream() is called.
  void socket.connect()

  return {
    get conversationId() {
      return conversationId
    },

    stream(message: string): AsyncIterable<ConversationChunk> {
      return streamTurn(socket, message, (id) => {
        conversationId = id
      })
    },

    async approveAction(actionId: string) {
      await apiFetch<unknown>(endpoint, apiKey, `/actions/${actionId}/approve`, {
        method: 'POST',
      })
    },

    async rejectAction(actionId: string, reason?: string) {
      await apiFetch<unknown>(endpoint, apiKey, `/actions/${actionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
    },

    close() {
      socket.close()
    },
  }
}

/**
 * Sends a user_message and yields chunks until a done or error chunk is received.
 * If the server sends a 'connected' chunk, the onConnected callback is invoked with the
 * conversationId before it is yielded to the caller.
 */
async function* streamTurn(
  socket: ManagedWebSocket,
  message: string,
  onConnected: (conversationId: string) => void
): AsyncIterable<ConversationChunk> {
  // Buffer for incoming chunks and a notify function to wake the async iterator
  const buffer: ConversationChunk[] = []
  let resolve: (() => void) | null = null
  let done = false

  const removeListener = socket.onMessage((chunk) => {
    // Capture conversationId from connected or done chunks
    if (chunk.type === 'connected') {
      onConnected(chunk.conversationId)
    }

    buffer.push(chunk)
    resolve?.()
    resolve = null

    if (chunk.type === 'done' || chunk.type === 'error') {
      done = true
    }
  })

  // Wait for the connection to be open before sending, to avoid losing the message
  await socket.waitForOpen()
  socket.send({ type: 'user_message', content: message })

  try {
    while (true) {
      const chunk = buffer.shift()
      if (chunk !== undefined) {
        yield chunk
        if (chunk.type === 'done' || chunk.type === 'error') break
      } else if (done) {
        break
      } else {
        // Wait for the next chunk
        await new Promise<void>((res) => {
          resolve = res
        })
      }
    }
  } finally {
    removeListener()
  }
}
