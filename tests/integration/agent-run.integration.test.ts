import { describe, expect, it } from 'vitest'
import { getClient, getEnv, skipIfNoEnv } from './setup'

function shouldSkip() {
  if (skipIfNoEnv()) return true
  const env = getEnv()
  return !env.SAPT_AGENT_ID
}

describe.skipIf(shouldSkip())('Agent Run (integration)', () => {
  it('run() returns text response', async () => {
    const client = getClient()
    const agentId = getEnv().SAPT_AGENT_ID!

    const result = await client.run(agentId, 'Say "hello" and nothing else.')

    expect(result.text).toBeDefined()
    expect(result.text.length).toBeGreaterThan(0)
    expect(result.conversationId).toBeDefined()
    expect(result.usage).toBeDefined()
    expect(typeof result.usage.inputTokens).toBe('number')
    expect(typeof result.usage.outputTokens).toBe('number')
  }, 30_000) // Agent runs can take time

  it('stream() yields text chunks', async () => {
    const client = getClient()
    const agentId = getEnv().SAPT_AGENT_ID!

    const chunks: Array<{ type: string }> = []
    let gotText = false
    let gotDone = false

    for await (const chunk of client.stream(agentId, 'Say "hi"')) {
      chunks.push(chunk)
      if (chunk.type === 'text') gotText = true
      if (chunk.type === 'done') gotDone = true
    }

    expect(gotText).toBe(true)
    expect(gotDone).toBe(true)
    expect(chunks.length).toBeGreaterThan(1)
  }, 30_000)
})
