# Sapt Agents SDK

Official TypeScript SDK for [Sapt AI](https://sapt.ai) agents. Build, manage, and interact with AI agents programmatically.

## Install

```bash
npm install @sapt/agents
```

> Requires Node.js 22+ (uses native `WebSocket` and `fetch`).

## Quick Start

```typescript
import { createSaptAgentClient } from '@sapt/agents'

const sapt = createSaptAgentClient({
  projectId: 'your-project-id',
  apiKey: 'sapt_your_api_key',
  endpoint: 'https://api.sapt.ai',
})

// Single-turn run
const result = await sapt.run('agent-id', 'What are my top keywords?')
console.log(result.text)
```

## Streaming

Stream responses as they're generated:

```typescript
for await (const chunk of sapt.stream('agent-id', 'Analyze my competitors')) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.content)
      break
    case 'tool_start':
      console.log(`\nUsing tool: ${chunk.toolSlug}`)
      break
    case 'tool_end':
      console.log(`Tool complete: ${chunk.toolSlug}`)
      break
    case 'done':
      console.log('\n\nDone!')
      break
    case 'error':
      console.error(chunk.error)
      break
  }
}
```

## Multi-Turn Conversations

Use WebSocket conversations for multi-turn sessions:

```typescript
const conv = sapt.conversation('agent-id')

// First turn
for await (const chunk of conv.stream('List my GBP locations')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
}

// Follow-up in same conversation
for await (const chunk of conv.stream('Show reviews for the first one')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
}

// Resume later with the same conversationId
const resumed = sapt.conversation('agent-id', {
  conversationId: conv.conversationId!,
})

conv.close()
```

## Pending Actions

Agents can request approval before taking actions (e.g., sending an email, publishing a post). Handle these in the stream:

```typescript
for await (const chunk of sapt.stream('agent-id', 'Reply to the latest review')) {
  if (chunk.type === 'pending_action') {
    console.log(`Agent wants to: ${chunk.description}`)
    // Approve or reject
    await sapt.actions.approve(chunk.pendingActionId)
    // or: await sapt.actions.reject(chunk.pendingActionId, 'Not now')
  }
}
```

## Managing Agents

```typescript
// List agents
const agents = await sapt.agents.list()

// Create an agent
const agent = await sapt.agents.create({
  name: 'SEO Assistant',
  systemPrompt: 'You help with SEO analysis and keyword research.',
  toolCategories: ['serp', 'cms'],
})

// Update an agent
await sapt.agents.update(agent.id, {
  description: 'Handles SEO audits and content optimization',
})

// Delete an agent
await sapt.agents.delete(agent.id)
```

## Memory

Give agents persistent knowledge:

```typescript
// Create a memory entry
await sapt.memory.create({
  slug: 'brand-voice',
  title: 'Brand Voice Guidelines',
  description: 'How to write in our brand voice',
  content: 'We write in a friendly, professional tone...',
})

// List all memory entries
const entries = await sapt.memory.list()

// Update
await sapt.memory.update('brand-voice', {
  content: 'Updated brand voice guidelines...',
})

// Delete
await sapt.memory.delete('brand-voice')
```

## Authentication

API keys are created in the [Sapt dashboard](https://app.sapt.ai). Keys are scoped to a project and use the format `sapt_...`.

```typescript
const sapt = createSaptAgentClient({
  projectId: 'your-project-id',
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: 'https://api.sapt.ai',
})
```

## Chunk Types

All streaming methods yield `AgentChunk` objects:

| Type | Fields | Description |
|------|--------|-------------|
| `text` | `content`, `runId` | Text content from the agent |
| `tool_start` | `toolSlug`, `toolInput`, `runId` | Agent started using a tool |
| `tool_end` | `toolSlug`, `toolResult`, `runId` | Tool execution completed |
| `pending_action` | `pendingActionId`, `actionSlug`, `description`, `actionInput`, `runId` | Agent requests approval |
| `done` | `conversationId`, `runId` | Turn complete |
| `error` | `error`, `runId` | Error occurred |

## License

MIT
