import { apiFetch } from './transport/http'

/** Operations for resolving pending actions outside of a conversation context. */
export interface ActionsNamespace {
  /** Approve a pending action, allowing the agent to proceed. */
  approve(actionId: string): Promise<void>
  /** Reject a pending action with an optional reason. */
  reject(actionId: string, reason?: string): Promise<void>
}

export function createActionsNamespace(
  endpoint: string,
  apiKey: string,
  projectId?: string
): ActionsNamespace {
  return {
    async approve(actionId) {
      await apiFetch<unknown>(endpoint, apiKey, `/actions/${actionId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ projectId }),
      })
    },

    async reject(actionId, reason) {
      await apiFetch<unknown>(endpoint, apiKey, `/actions/${actionId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ projectId, reason }),
      })
    },
  }
}
