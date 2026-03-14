export class SaptApiError extends Error {
  readonly code: string | undefined
  readonly status: number
  readonly retryAfter: number | undefined

  constructor(message: string, status: number, code?: string, retryAfter?: number) {
    super(message)
    this.name = 'SaptApiError'
    this.code = code
    this.status = status
    this.retryAfter = retryAfter
  }
}
