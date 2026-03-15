import { apiFetch, buildQueryString } from './transport/http'
import type { CreditBalance, CreditTransaction } from './types'

/** Credit balance and transaction history for a project. */
export interface CreditsNamespace {
  /** Get the current credit balance for a project. */
  getBalance(projectId: string): Promise<CreditBalance>
  /** List credit transactions for a project. */
  getTransactions(
    projectId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<CreditTransaction[]>
}

export function createCreditsNamespace(
  endpoint: string,
  apiKey: string,
  projectId: string
): CreditsNamespace {
  return {
    async getBalance(pid) {
      return apiFetch<CreditBalance>(endpoint, apiKey, `/projects/${pid}/credits`)
    },

    async getTransactions(pid, options) {
      const qs = buildQueryString({
        limit: options?.limit,
        offset: options?.offset,
      })
      const res = await apiFetch<{ transactions: CreditTransaction[] }>(
        endpoint,
        apiKey,
        `/projects/${pid}/credits/transactions${qs}`
      )
      return res.transactions
    },
  }
}
