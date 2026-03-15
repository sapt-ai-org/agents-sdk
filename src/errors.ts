export type SaptErrorCode =
  // HTTP-mapped
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'PAYMENT_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PRECONDITION_FAILED'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR'
  | 'NOT_IMPLEMENTED'
  | 'SERVICE_UNAVAILABLE'
  // Domain-specific
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INSUFFICIENT_CREDITS'
  | 'RESOURCE_EXHAUSTED'
  | 'TOKEN_EXPIRED'
  | 'ACCOUNT_DISCONNECTED'
  | 'PLATFORM_ERROR'
  | 'PLATFORM_UNAVAILABLE'
  | 'INTERNAL_ERROR'

export class SaptApiError extends Error {
  readonly code: SaptErrorCode
  readonly status: number
  readonly details: Record<string, unknown>
  readonly retryAfter: number | undefined

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>,
    retryAfter?: number
  ) {
    super(message)
    this.name = 'SaptApiError'
    this.code = (code as SaptErrorCode) ?? 'INTERNAL_ERROR'
    this.status = status
    this.details = details ?? {}
    this.retryAfter = retryAfter
  }
}
