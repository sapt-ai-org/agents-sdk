/**
 * Streaming agent run — text arrives in real-time chunks.
 *
 * Usage:
 *   npx tsx examples/02-streaming.ts
 */
import { createSaptAgentClient } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

const agentId = process.env.SAPT_AGENT_ID!

for await (const chunk of sapt.stream(agentId, 'Write a short haiku about marketing')) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.content)
      break
    case 'tool_start':
      console.log(`\n[Tool: ${chunk.toolSlug}]`)
      break
    case 'tool_end':
      console.log(`[Tool done: ${chunk.toolSlug}]`)
      break
    case 'done':
      console.log('\n\nDone.')
      break
    case 'error':
      console.error('\nError:', chunk.error)
      break
  }
}
