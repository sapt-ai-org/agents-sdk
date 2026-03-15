/**
 * Social media account connection flow.
 *
 * Generates a connect link, then polls until the user completes OAuth.
 *
 * Usage:
 *   npx tsx examples/04-social-connect.ts
 */
import { createSaptAgentClient } from '../src/index'

const sapt = createSaptAgentClient({
  projectId: process.env.SAPT_PROJECT_ID!,
  apiKey: process.env.SAPT_API_KEY!,
  endpoint: process.env.SAPT_ENDPOINT || 'https://api.sapt.ai',
})

const projectId = process.env.SAPT_PROJECT_ID!

// Step 1: Create a connect link
const link = await sapt.socials.createConnectLink({
  projectId,
  platform: 'meta',
})

console.log('Connect your Instagram/Facebook account:')
console.log(link.connectUrl)
console.log(`\nLink expires at: ${link.expiresAt}`)
console.log('Polling for completion...\n')

// Step 2: Poll until connected
const poll = async () => {
  while (true) {
    const status = await sapt.socials.getConnectStatus(link.sessionId)

    if (status.status === 'completed') {
      console.log('Connected! Accounts:')
      for (const account of status.accounts ?? []) {
        console.log(`  - ${account.platform}: @${account.username}`)
      }
      return
    }

    if (status.status === 'failed') {
      console.error('Connection failed:', status.error)
      return
    }

    if (status.status === 'expired') {
      console.error('Connect link expired.')
      return
    }

    // Still pending — wait 3 seconds
    await new Promise((r) => setTimeout(r, 3000))
    process.stdout.write('.')
  }
}

await poll()
