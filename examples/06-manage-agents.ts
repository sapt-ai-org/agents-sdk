/**
 * Agent definition CRUD — create, update, list, delete agents programmatically.
 *
 * Usage:
 *   npx tsx examples/06-manage-agents.ts
 */
import { createSaptAgentClient } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

// Create an agent
const agent = await sapt.agents.create({
  name: 'Customer Support Bot',
  systemPrompt: `You are a friendly customer support agent for a coffee company.
Answer questions about orders, shipping, and products.
Be concise and helpful.`,
  toolCategories: [],
  maxSteps: 5,
})

console.log('Created agent:', agent.id, agent.name)

// Update it
const updated = await sapt.agents.update(agent.id, {
  description: 'Handles customer inquiries about orders and products',
  metadata: { department: 'support', priority: 'high' },
})

console.log('Updated:', updated.description)

// List all agents
const { items } = await sapt.agents.list({ limit: 10 })
console.log(`\nAll agents (${items.length}):`)
for (const a of items) {
  console.log(`  - ${a.name} (${a.id})`)
}

// Clean up
await sapt.agents.delete(agent.id)
console.log('\nDeleted agent:', agent.id)
