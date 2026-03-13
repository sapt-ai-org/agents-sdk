import { apiFetch } from './transport/http'
import type { CreateMemoryEntryInput, MemoryEntry, UpdateMemoryEntryInput } from './types'

/** CRUD operations for memory entries scoped to the current project. */
export interface MemoryNamespace {
  /** List all memory entries in the project. */
  list(): Promise<MemoryEntry[]>
  /** Get a single memory entry by slug. */
  get(slug: string): Promise<MemoryEntry>
  /** Create a new memory entry. */
  create(input: CreateMemoryEntryInput): Promise<MemoryEntry>
  /** Update an existing memory entry by slug. */
  update(slug: string, input: UpdateMemoryEntryInput): Promise<MemoryEntry>
  /** Delete a memory entry by slug. */
  delete(slug: string): Promise<void>
}

export function createMemoryNamespace(
  endpoint: string,
  apiKey: string,
  projectId: string
): MemoryNamespace {
  const base = `/v1/projects/${projectId}/memory-entries`

  return {
    list() {
      return apiFetch<MemoryEntry[]>(endpoint, apiKey, base)
    },

    get(slug) {
      return apiFetch<MemoryEntry>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`)
    },

    create(input) {
      return apiFetch<MemoryEntry>(endpoint, apiKey, base, {
        method: 'POST',
        body: JSON.stringify(input),
      })
    },

    update(slug, input) {
      return apiFetch<MemoryEntry>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
    },

    async delete(slug) {
      await apiFetch<unknown>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
    },
  }
}
