import { createActionsNamespace, type ActionsNamespace } from './actions'
import { createAgentsNamespace, type AgentsNamespace } from './agents'
import { createConversation, type Conversation } from './conversation'
import { createCreditsNamespace, type CreditsNamespace } from './credits'
import { createMemoryNamespace, type MemoryNamespace } from './memory'
import { createProjectsNamespace, type ProjectsNamespace } from './projects'
import { createSocialsNamespace, type SocialsNamespace } from './socials'
import { createTeamNamespace, type TeamNamespace } from './team'
import { apiFetch, sseStream } from './transport/http'
import type { AgentChunk, ConversationOptions, RunResult, SaptAgentClientConfig } from './types'

/** The main SDK client exposing agent runs, conversations, memory, and action resolution. */
export interface SaptAgentClient {
  /** Agent definition CRUD operations. */
  readonly agents: AgentsNamespace
  /** Memory entry CRUD operations. */
  readonly memory: MemoryNamespace
  /** Out-of-band pending action resolution. */
  readonly actions: ActionsNamespace
  /** Project listing and retrieval. */
  readonly projects: ProjectsNamespace
  /** Team management operations. */
  readonly team: TeamNamespace
  /** Social media account management — connect, health check, reconnect. */
  readonly socials: SocialsNamespace
  /** Credit balance and transaction history. */
  readonly credits: CreditsNamespace

  /**
   * Single-turn run — sends a message and returns the complete text response.
   * @returns The full response text and the conversationId for optional continuation.
   */
  run(agentId: string, message: string): Promise<RunResult>

  /**
   * Single-turn streaming run — sends a message and yields chunks as they arrive.
   */
  stream(agentId: string, message: string): AsyncIterable<AgentChunk>

  /**
   * Opens a multi-turn WebSocket conversation.
   * @param agentId - The agent to converse with.
   * @param options - Optional conversationId to resume an existing session.
   */
  conversation(agentId: string, options?: ConversationOptions): Conversation
}

/**
 * Creates a new Sapt Agent SDK client.
 *
 * @param config - Project ID, API key, and endpoint URL.
 * @returns A fully initialized {@link SaptAgentClient}.
 *
 * @example
 * ```ts
 * import { createSaptAgentClient } from '@sapt/agents'
 *
 * const sapt = createSaptAgentClient({
 *   projectId: 'proj_abc123',
 *   apiKey: 'sapt_live_...',
 *   endpoint: 'https://api.sapt.ai',
 * })
 *
 * // Single-turn run
 * const { text } = await sapt.run('agent-id', 'Hello!')
 *
 * // Streaming run
 * for await (const chunk of sapt.stream('agent-id', 'Hello!')) {
 *   if (chunk.type === 'text') process.stdout.write(chunk.content)
 * }
 *
 * // Social connect
 * const link = await sapt.socials.createConnectLink({
 *   projectId: 'proj_abc123',
 *   platform: 'meta',
 * })
 * console.log('Connect here:', link.connectUrl)
 *
 * // Check credit balance
 * const balance = await sapt.credits.getBalance('proj_abc123')
 * console.log('Credits:', balance.credits)
 * ```
 */
export function createSaptAgentClient(config: SaptAgentClientConfig): SaptAgentClient {
  const { projectId, apiKey, endpoint } = config

  if (!projectId) throw new Error('projectId is required')
  if (!apiKey) throw new Error('apiKey is required')
  if (!endpoint) throw new Error('endpoint is required')

  // Trim trailing slash for consistent URL construction
  const base = endpoint.replace(/\/$/, '')

  const agents = createAgentsNamespace(base, apiKey, projectId)
  const memory = createMemoryNamespace(base, apiKey, projectId)
  const actions = createActionsNamespace(base, apiKey, projectId)
  const projects = createProjectsNamespace(base, apiKey)
  const team = createTeamNamespace(base, apiKey, projectId)
  const socials = createSocialsNamespace(base, apiKey)
  const credits = createCreditsNamespace(base, apiKey, projectId)

  return {
    agents,
    memory,
    actions,
    projects,
    team,
    socials,
    credits,

    async run(agentId, message) {
      const res = await apiFetch<{ conversationId: string; runId: string; text: string; usage: { inputTokens: number; outputTokens: number; model: string } }>(
        base,
        apiKey,
        `/agents/${agentId}/run`,
        {
          method: 'POST',
          body: JSON.stringify({ message, projectId }),
        }
      )

      return { text: res.text, conversationId: res.conversationId, usage: res.usage }
    },

    stream(agentId, message) {
      return sseStream(base, apiKey, `/agents/${agentId}/run`, { message, projectId })
    },

    conversation(agentId, options) {
      return createConversation(base, apiKey, agentId, options)
    },
  }
}
