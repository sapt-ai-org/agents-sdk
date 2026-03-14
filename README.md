# @sapt/agents

TypeScript SDK for [Sapt](https://sapt.ai). Give your AI agents 140+ real business tools and let them loose.

## Install

```bash
npm install @sapt/agents
```

Node 22+. Zero dependencies. Just vibes.

## Do stuff

```typescript
import { createSaptAgentClient } from '@sapt/agents'

const sapt = createSaptAgentClient({
  projectId: 'your-project-id',
  apiKey: 'sapt_your_api_key',
  endpoint: 'https://api.sapt.ai',
})

// that's it. go wild.
const result = await sapt.run('agent-id', 'What are my top keywords?')
console.log(result.text)
```

## Stream it

```typescript
for await (const chunk of sapt.stream('agent-id', 'Analyze my competitors')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
}
```

## Have a conversation

```typescript
const conv = sapt.conversation('agent-id')

for await (const chunk of conv.stream('List my GBP locations')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
}

// agent remembers everything
for await (const chunk of conv.stream('Show reviews for the first one')) {
  if (chunk.type === 'text') process.stdout.write(chunk.content)
}

conv.close()
```

## What can agents actually do?

SEO, CMS, social media, Meta ads, email marketing, Google Business Profile, lead gen (Reddit, Apollo, Instantly), customer support, calendars, and more. 12 categories. 140+ tools. Your agent can post to Instagram, track keyword rankings, write blog posts, research leads on Reddit, and reply to Google reviews. All in one turn.

## Docs

Full reference, guides, and every tool listed: **[docs.sapt.ai](https://docs.sapt.ai)**

## License

MIT
