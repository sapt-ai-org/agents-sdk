import { apiFetch } from './transport/http'
import type {
  AccountHealth,
  ConnectLinkResponse,
  ConnectStatus,
  CreateConnectLinkInput,
  SocialAccount,
} from './types'

/** Social media account management — connect, health check, reconnect. */
export interface SocialsNamespace {
  /** Create a connect link for the user to authorize their social accounts via OAuth. */
  createConnectLink(input: CreateConnectLinkInput): Promise<ConnectLinkResponse>
  /** Poll the status of a connect session (pending/completed/expired/failed). */
  getConnectStatus(sessionId: string): Promise<ConnectStatus>
  /** List all connected social accounts for a project. */
  listAccounts(projectId: string): Promise<SocialAccount[]>
  /** Check connection health (token expiry, revocation) for all accounts. */
  checkAccountHealth(projectId: string): Promise<AccountHealth[]>
}

export function createSocialsNamespace(
  endpoint: string,
  apiKey: string
): SocialsNamespace {
  return {
    async createConnectLink(input) {
      return apiFetch<ConnectLinkResponse>(endpoint, apiKey, '/socials/connect', {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },

    async getConnectStatus(sessionId) {
      return apiFetch<ConnectStatus>(endpoint, apiKey, `/socials/connect-status/${sessionId}`)
    },

    async listAccounts(projectId) {
      const res = await apiFetch<{ success: boolean; data: { accounts: SocialAccount[] } }>(
        endpoint,
        apiKey,
        `/socials/accounts/${projectId}`
      )
      return res.data.accounts
    },

    async checkAccountHealth(projectId) {
      const res = await apiFetch<{ accounts: AccountHealth[] }>(
        endpoint,
        apiKey,
        `/socials/accounts/${projectId}/health`
      )
      return res.accounts
    },
  }
}
