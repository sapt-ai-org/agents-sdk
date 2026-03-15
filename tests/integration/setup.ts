import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSaptAgentClient, type SaptAgentClient } from '../../src/index'

let _client: SaptAgentClient | null = null
let _env: Record<string, string> = {}

function loadEnv(): Record<string, string> {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const envPath = resolve(__dirname, '../../.env')
    const content = readFileSync(envPath, 'utf-8')
    const env: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim()
      env[key] = value
    }
    return env
  } catch {
    return {}
  }
}

export function getEnv(): Record<string, string> {
  if (Object.keys(_env).length === 0) {
    _env = loadEnv()
  }
  return _env
}

export function getClient(): SaptAgentClient {
  if (_client) return _client

  const env = getEnv()
  const endpoint = env.SAPT_ENDPOINT
  const projectId = env.SAPT_PROJECT_ID
  const apiKey = env.SAPT_API_KEY

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      'Integration tests require .env with SAPT_ENDPOINT, SAPT_PROJECT_ID, SAPT_API_KEY'
    )
  }

  _client = createSaptAgentClient({ projectId, apiKey, endpoint })
  return _client
}

export function requireEnv(key: string): string {
  const env = getEnv()
  const value = env[key]
  if (!value) throw new Error(`Missing .env variable: ${key}`)
  return value
}

/** Skip test if .env is not configured */
export function skipIfNoEnv() {
  const env = getEnv()
  if (!env.SAPT_ENDPOINT || !env.SAPT_PROJECT_ID || !env.SAPT_API_KEY) {
    return true
  }
  return false
}
