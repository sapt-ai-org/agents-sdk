/**
 * Basic agent run — send a message, get a response.
 *
 * Usage:
 *   npx tsx examples/01-basic-run.ts
 */
import { createSaptAgentClient } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

const agentId = process.env.SAPT_AGENT_ID!

const { text, conversationId } = await sapt.run(agentId, 'What can you help me with?')

console.log('Response:', text)
console.log('Conversation ID:', conversationId)
