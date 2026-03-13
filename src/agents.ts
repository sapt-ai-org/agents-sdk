import { apiFetch } from './transport/http'
import type {
  AgentDefinition,
  CreateAgentDefinitionInput,
  UpdateAgentDefinitionInput,
} from './types'

/** CRUD operations for agent definitions scoped to the current project. */
export interface AgentsNamespace {
  /** List all agent definitions in the project. */
  list(): Promise<AgentDefinition[]>
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
  const base = `/v1/projects/${projectId}/agents`

  return {
    list() {
      return apiFetch<AgentDefinition[]>(endpoint, apiKey, base)
    },

    get(agentId) {
      return apiFetch<AgentDefinition>(endpoint, apiKey, `${base}/${agentId}`)
    },

    create(input) {
      return apiFetch<AgentDefinition>(endpoint, apiKey, base, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },

    update(agentId, input) {
      return apiFetch<AgentDefinition>(endpoint, apiKey, `${base}/${agentId}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    },

    async delete(agentId) {
      await apiFetch<unknown>(endpoint, apiKey, `${base}/${agentId}`, {
        method: 'DELETE',
      })
    },
  }
}
