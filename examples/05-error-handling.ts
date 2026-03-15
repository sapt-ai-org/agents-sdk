/**
 * Error handling — shows how to catch and handle structured errors.
 *
 * Usage:
 *   npx tsx examples/05-error-handling.ts
 */
import { createSaptAgentClient, SaptApiError } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

// Try to get a project that doesn't exist
try {
  await sapt.projects.get('00000000-0000-0000-0000-000000000000')
} catch (err) {
  if (err instanceof SaptApiError) {
    console.log('Error code:', err.code) // e.g. 'NOT_FOUND'
    console.log('Message:', err.message) // e.g. 'Project not found'
    console.log('HTTP status:', err.status) // e.g. 404
    console.log('Details:', err.details) // e.g. { resourceType: 'project' }

    // Handle specific error codes
    switch (err.code) {
      case 'RATE_LIMITED':
        console.log(`Retry after ${err.retryAfter} seconds`)
        break
      case 'INSUFFICIENT_CREDITS':
        console.log(`Need ${err.details.required} credits, have ${err.details.available}`)
        break
      case 'TOKEN_EXPIRED':
        console.log('Social account token expired — generate a reconnect link')
        break
      default:
        console.log('Unhandled error:', err.code)
    }
  }
}
