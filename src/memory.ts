import { apiFetch, buildQueryString } from './transport/http'
import type {
  CreateMemoryEntryInput,
  ListOptions,
  MemoryEntry,
  MemoryEntrySummary,
  PaginatedResult,
  UpdateMemoryEntryInput,
} from './types'

/** CRUD operations for memory entries scoped to the current project. */
export interface MemoryNamespace {
  /** List memory entries in the project with optional pagination. Returns summaries (no content). */
  list(options?: ListOptions): Promise<PaginatedResult<MemoryEntrySummary>>
  /** Get a single memory entry by slug (includes content). */
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
  const base = `/projects/${projectId}/memory-entries`

  return {
    async list(options) {
      const qs = buildQueryString({
        limit: options?.limit,
        offset: options?.offset,
      })
      const res = await apiFetch<{
        entries: MemoryEntrySummary[]
        pagination: { limit: number; offset: number; hasMore: boolean }
      }>(endpoint, apiKey, `${base}${qs}`)
      return { items: res.entries, pagination: res.pagination }
    },

    async get(slug) {
      const res = await apiFetch<{ entry: MemoryEntry }>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`)
      return res.entry
    },

    async create(input) {
      const res = await apiFetch<{ entry: MemoryEntry }>(endpoint, apiKey, base, {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.entry
    },

    async update(slug, input) {
      const res = await apiFetch<{ entry: MemoryEntry }>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      })
      return res.entry
    },

    async delete(slug) {
      await apiFetch<unknown>(endpoint, apiKey, `${base}/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
    },
  }
}
