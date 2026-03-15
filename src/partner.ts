import { apiFetch } from './transport/http'
import type { PartnerCreditBalance } from './types'

/** Partner-level operations (only available with partner API keys). */
export interface PartnerNamespace {
  /** Get the partner's credit pool balance. */
  getCreditBalance(): Promise<PartnerCreditBalance>
}

export function createPartnerNamespace(
  endpoint: string,
  apiKey: string
): PartnerNamespace {
  return {
    async getCreditBalance() {
      return apiFetch<PartnerCreditBalance>(endpoint, apiKey, '/partner/credits')
    },
  }
}
