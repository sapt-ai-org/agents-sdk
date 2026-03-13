/** Configuration required to initialize the Sapt Agent SDK client. */
export interface SaptAgentClientConfig {
  /** Project ID — scopes all operations. */
  projectId: string
  /** API key for authentication. */
  apiKey: string
  /** Base endpoint URL, e.g. https://api.sapt.ai */
  endpoint: string
}

/** Configuration for an MCP (Model Context Protocol) server attached to an agent. */
export interface McpServerConfig {
  /** Display name of the MCP server. */
  name: string
  /** URL endpoint of the MCP server. */
  url: string
  /** Optional headers sent with every request to this MCP server. */
  headers?: Record<string, string>
}

/** Visibility level for an agent definition. */
export type AgentAccess = 'project_member' | 'specific_roles' | 'public'

/** Full agent definition as returned by the API. */
export interface AgentDefinition {
  /** Unique identifier. */
  id: string
  /** Project this agent belongs to. */
  projectId: string
  /** Human-readable agent name. */
  name: string
  /** Optional description of the agent's purpose. */
  description: string | null
  /** Whether this is a platform-provided built-in agent. */
  builtIn: boolean
  /** System prompt that defines the agent's behavior. */
  systemPrompt: string
  /** Slugs of memory entries available to the agent. */
  memoryFiles: string[]
  /** Tool category slugs the agent can invoke. */
  toolCategories: string[]
  /** MCP servers the agent connects to, if any. */
  mcpServers: McpServerConfig[] | null
  /** Visibility / access control level. */
  access: AgentAccess
  /** Role IDs allowed when access is 'specific_roles'. */
  allowedRoles: string[] | null
  /** Maximum tool-call steps per run. */
  maxSteps: number
  /** LLM model override, or null for the platform default. */
  model: string | null
  /** Arbitrary key-value metadata. */
  metadata: Record<string, unknown>
  /** ISO-8601 creation timestamp. */
  createdAt: string
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string
}

/** Input for creating a new agent definition. */
export interface CreateAgentDefinitionInput {
  /** Human-readable agent name. */
  name: string
  /** Optional description of the agent's purpose. */
  description?: string
  /** System prompt that defines the agent's behavior. */
  systemPrompt: string
  /** Slugs of memory entries available to the agent. */
  memoryFiles?: string[]
  /** Tool category slugs the agent can invoke. */
  toolCategories: string[]
  /** MCP servers the agent connects to. */
  mcpServers?: McpServerConfig[]
  /** Visibility / access control level. */
  access?: AgentAccess
  /** Role IDs allowed when access is 'specific_roles'. */
  allowedRoles?: string[]
  /** Maximum tool-call steps per run. */
  maxSteps?: number
  /** LLM model override. */
  model?: string
  /** Arbitrary key-value metadata. */
  metadata?: Record<string, unknown>
}

/** Input for updating an existing agent definition. All fields are optional. */
export interface UpdateAgentDefinitionInput {
  /** Human-readable agent name. */
  name?: string
  /** Optional description. Pass null to clear. */
  description?: string | null
  /** System prompt that defines the agent's behavior. */
  systemPrompt?: string
  /** Slugs of memory entries available to the agent. */
  memoryFiles?: string[]
  /** Tool category slugs the agent can invoke. */
  toolCategories?: string[]
  /** MCP servers the agent connects to. Pass null to clear. */
  mcpServers?: McpServerConfig[] | null
  /** Visibility / access control level. */
  access?: AgentAccess
  /** Role IDs allowed when access is 'specific_roles'. Pass null to clear. */
  allowedRoles?: string[] | null
  /** Maximum tool-call steps per run. */
  maxSteps?: number
  /** LLM model override. Pass null to revert to platform default. */
  model?: string | null
  /** Arbitrary key-value metadata. */
  metadata?: Record<string, unknown>
}

/** A memory entry — a named document agents can reference during runs. */
export interface MemoryEntry {
  /** Unique identifier. */
  id: string
  /** Project this entry belongs to. */
  projectId: string
  /** URL-safe unique slug used to reference this entry. */
  slug: string
  /** Human-readable title. */
  title: string
  /** Short description of the entry's content. */
  description: string
  /** Full text content of the memory entry. */
  content: string
  /** Arbitrary key-value metadata. */
  metadata: Record<string, unknown> | null
  /** ISO-8601 creation timestamp. */
  createdAt: string
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string
}

/** Input for creating a new memory entry. */
export interface CreateMemoryEntryInput {
  /** URL-safe unique slug used to reference this entry. */
  slug: string
  /** Human-readable title. */
  title: string
  /** Short description of the entry's content. */
  description: string
  /** Full text content of the memory entry. */
  content: string
  /** Arbitrary key-value metadata. */
  metadata?: Record<string, unknown>
}

/** Input for updating an existing memory entry. All fields are optional. */
export interface UpdateMemoryEntryInput {
  /** Human-readable title. */
  title?: string
  /** Short description of the entry's content. */
  description?: string
  /** Full text content of the memory entry. */
  content?: string
  /** Arbitrary key-value metadata. Pass null to clear. */
  metadata?: Record<string, unknown> | null
}

// --- Stream chunk types ---

/**
 * Discriminated union of all chunk types yielded by sapt.stream() and conv.stream().
 *
 * Mirrors the server-side AgentStreamChunk type, with SDK-visible types only.
 * pong is intentionally excluded — it is handled internally by the WebSocket transport.
 */
export type AgentChunk =
  | { type: 'text'; content: string; runId: string }
  | { type: 'tool_start'; toolSlug: string; toolInput: unknown; runId: string }
  | { type: 'tool_end'; toolSlug: string; toolResult: unknown; runId: string }
  | {
      type: 'pending_action'
      pendingActionId: string
      actionSlug: string
      description: string
      actionInput: unknown
      runId: string
    }
  | { type: 'done'; conversationId: string; runId: string }
  | { type: 'error'; error: string; runId: string }

/**
 * Extended chunk type for conversation streams — includes the connected event
 * that carries the conversationId on first connection.
 */
export type ConversationChunk = { type: 'connected'; conversationId: string } | AgentChunk

/** Result of a non-streaming single-turn agent run. */
export interface RunResult {
  /** The agent's complete text response. */
  text: string
  /** Conversation ID that can be used to continue the conversation. */
  conversationId: string
}

/** Options for opening a multi-turn conversation. */
export interface ConversationOptions {
  /** Resume an existing conversation by ID. If omitted, a new conversation is created. */
  conversationId?: string
}

/** @internal WebSocket server-to-client message protocol. */
export type ServerMessage =
  | { type: 'connected'; conversationId: string }
  | { type: 'status'; status: 'thinking' | 'streaming'; runId: string }
  | { type: 'agent_chunk'; content: string; runId: string }
  | { type: 'tool_start'; toolSlug: string; toolInput: unknown; runId: string }
  | { type: 'tool_end'; toolSlug: string; toolResult: unknown; runId: string }
  | {
      type: 'pending_action'
      pendingActionId: string
      actionSlug: string
      description: string
      actionInput: unknown
      runId: string
    }
  | { type: 'done'; conversationId: string; runId: string }
  | { type: 'error'; error: string; runId: string }
  | { type: 'pong' }

/** @internal WebSocket client-to-server message protocol. */
export type ClientMessage =
  | { type: 'user_message'; content: string }
  | { type: 'ping' }
  | { type: 'resume'; lastSeq: number }
