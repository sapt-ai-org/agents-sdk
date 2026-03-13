import type { ClientMessage, ConversationChunk, ServerMessage } from '../types'

const PING_INTERVAL_MS = 20_000
const MAX_RECONNECT_ATTEMPTS = 8
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 30_000

type MessageListener = (chunk: ConversationChunk) => void
type CloseListener = () => void

/**
 * Managed WebSocket connection with automatic reconnection and ping/pong keep-alive.
 *
 * On reconnect, the connection re-authenticates (new token via getToken()) and
 * re-establishes the session with the same conversationId, resuming from the
 * last received chunk ID where supported.
 */
export class ManagedWebSocket {
  private ws: WebSocket | null = null
  private closed = false
  private reconnectAttempt = 0
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private readonly listeners = new Set<MessageListener>()
  private readonly closeListeners = new Set<CloseListener>()
  private openResolvers: Array<() => void> = []
  private isOpen = false
  // Tracks the last seq received from the server for stream resumption on reconnect
  private lastSeq = 0

  constructor(
    private readonly buildUrl: () => Promise<string>,
    private readonly onConnectError?: (err: Error) => void
  ) {}

  /** Connect (or reconnect) the WebSocket. */
  async connect(): Promise<void> {
    if (this.closed) return

    let url: string
    try {
      url = await this.buildUrl()
    } catch (err) {
      this.onConnectError?.(err instanceof Error ? err : new Error(String(err)))
      return
    }

    const ws = new WebSocket(url)
    this.ws = ws

    ws.addEventListener('open', () => {
      const isReconnect = this.reconnectAttempt > 0
      this.reconnectAttempt = 0
      this.isOpen = true
      this.startPing(ws)

      // On reconnect, ask the server to replay any missed chunks
      if (isReconnect && this.lastSeq > 0) {
        ws.send(JSON.stringify({ type: 'resume', lastSeq: this.lastSeq } satisfies ClientMessage))
      }

      // Notify any callers waiting for the connection to open
      const resolvers = this.openResolvers.splice(0)
      for (const r of resolvers) r()
    })

    ws.addEventListener('message', (event) => {
      let msg: ServerMessage
      try {
        msg = JSON.parse(event.data as string) as ServerMessage
      } catch {
        return
      }
      this.dispatchMessage(msg)
    })

    ws.addEventListener('close', () => {
      this.stopPing()
      this.isOpen = false
      if (!this.closed) {
        void this.scheduleReconnect()
      } else {
        this.notifyClose()
      }
    })

    ws.addEventListener('error', () => {
      // error is always followed by close — no additional handling needed
    })
  }

  /** Send a typed client message. No-ops if the socket is not open. */
  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /**
   * Resolves when the WebSocket is open and ready to send messages.
   * If the socket is already open, resolves immediately.
   */
  waitForOpen(): Promise<void> {
    if (this.isOpen) return Promise.resolve()
    return new Promise((resolve) => {
      this.openResolvers.push(resolve)
    })
  }

  /** Close the connection permanently (no reconnect). */
  close(): void {
    this.closed = true
    this.stopPing()
    this.ws?.close()
    this.ws = null
    // Resolve any pending waitForOpen() callers so they don't hang
    const resolvers = this.openResolvers.splice(0)
    for (const r of resolvers) r()
  }

  /** Register a listener for incoming server messages mapped to ConversationChunk. */
  onMessage(listener: MessageListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Register a listener for permanent close (called when close() is invoked and socket closes). */
  onClose(listener: CloseListener): () => void {
    this.closeListeners.add(listener)
    return () => this.closeListeners.delete(listener)
  }

  private dispatchMessage(msg: ServerMessage & { seq?: number }): void {
    // Track the highest seq seen so reconnects can request replay from that point
    if (msg.seq !== undefined && msg.seq > this.lastSeq) {
      this.lastSeq = msg.seq
    }

    const chunk = serverMessageToChunk(msg)
    if (chunk !== null) {
      for (const listener of this.listeners) {
        listener(chunk)
      }
    }
  }

  private notifyClose(): void {
    for (const listener of this.closeListeners) {
      listener()
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.closed || this.reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) return

    const delay = Math.min(BASE_BACKOFF_MS * Math.pow(2, this.reconnectAttempt), MAX_BACKOFF_MS)
    this.reconnectAttempt++

    await sleep(delay)
    if (!this.closed) {
      await this.connect()
    }
  }

  private startPing(ws: WebSocket): void {
    this.stopPing()
    this.pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' } satisfies ClientMessage))
      }
    }, PING_INTERVAL_MS)
  }

  private stopPing(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Maps a ServerMessage to a ConversationChunk, or null for transport-level
 * messages that should not be surfaced to callers (pong, status).
 */
function serverMessageToChunk(msg: ServerMessage): ConversationChunk | null {
  switch (msg.type) {
    case 'connected':
      return { type: 'connected', conversationId: msg.conversationId }
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
    // pong and status are transport-level — not surfaced
    case 'pong':
    case 'status':
      return null
  }
}
