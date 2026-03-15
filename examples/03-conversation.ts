/**
 * Multi-turn conversation over WebSocket.
 *
 * Usage:
 *   npx tsx examples/03-conversation.ts
 */
import { createSaptAgentClient } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

const agentId = process.env.SAPT_AGENT_ID!
const conv = sapt.conversation(agentId)

// First turn
console.log('--- Turn 1 ---')
for await (const chunk of conv.stream('My business is a coffee roastery called Bean & Bloom.')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
  if (chunk.type === 'done') console.log('\n')
}

// Second turn — agent remembers context
console.log('--- Turn 2 ---')
for await (const chunk of conv.stream('What marketing strategies would you suggest for us?')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
  if (chunk.type === 'done') console.log('\n')
}

console.log('Conversation ID:', conv.conversationId)
conv.close()
