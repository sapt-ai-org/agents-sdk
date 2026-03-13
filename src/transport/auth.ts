/**
 * Exchanges an API key for a short-lived JWT suitable for WebSocket authentication.
 * The JWT is passed as a query parameter on the WebSocket URL.
 */
export async function exchangeApiKeyForWsToken(endpoint: string, apiKey: string): Promise<string> {
  const res = await fetch(`${endpoint}/v1/auth/ws-token`, {
    method: 'POST',
    headers: {
      Authorization: `ApiKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Failed to obtain WebSocket token: ${res.status} ${res.statusText}`)
  }

  const json = (await res.json()) as { token?: string }
  if (!json.token) {
    throw new Error('WebSocket token response missing token field')
  }

  return json.token
}
