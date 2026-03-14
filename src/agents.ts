import { apiFetch, buildQueryString } from './transport/http'
import type {
  AgentDefinition,
  CreateAgentDefinitionInput,
  ListOptions,
  PaginatedResult,
  UpdateAgentDefinitionInput,
} from './types'

/** CRUD operations for agent definitions scoped to the current project. */
export interface AgentsNamespace {
  /** List agent definitions in the project with optional pagination. */
  list(options?: ListOptions): Promise<PaginatedResult<AgentDefinition>>
  /** Get a single agent definition by ID. */
  get(agentId: string): Promise<AgentDefinition>
  /** Create a new agent definition. */
  create(input: CreateAgentDefinitionInput): Promise<AgentDefinition>
  /** Update an existing agent definition. */
  update(agentId: string, input: UpdateAgentDefinitionInput): Promise<AgentDefinition>
  /** Delete an agent definition by ID. */
  delete(agentId: string): Promise<void>
}

export function createAgentsNamespace(
  endpoint: string,
  apiKey: string,
  projectId: string
): AgentsNamespace {
  const base = `/projects/${projectId}/agents`

  return {
    async list(options) {
      const qs = buildQueryString({
        limit: options?.limit,
        offset: options?.offset,
      })
      const res = await apiFetch<{
        agents: AgentDefinition[]
        pagination: { limit: number; offset: number; hasMore: boolean }
      }>(endpoint, apiKey, `${base}${qs}`)
      return { items: res.agents, pagination: res.pagination }
    },

    async get(agentId) {
      const res = await apiFetch<{ agent: AgentDefinition }>(endpoint, apiKey, `${base}/${agentId}`)
      return res.agent
    },

    async create(input) {
      const res = await apiFetch<{ agent: AgentDefinition }>(endpoint, apiKey, base, {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.agent
    },

    async update(agentId, input) {
      const res = await apiFetch<{ agent: AgentDefinition }>(endpoint, apiKey, `${base}/${agentId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
      return res.agent
    },

    async delete(agentId) {
      await apiFetch<unknown>(endpoint, apiKey, `${base}/${agentId}`, {
        method: 'DELETE',
      })
    },
  }
}
