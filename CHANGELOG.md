# Changelog

## 0.1.5

### Added

- `SaptApiError` class with structured error codes (`code`, `status`, `retryAfter`) — replaces plain `Error` throws
- `Usage` type exposed in `RunResult` (`inputTokens`, `outputTokens`, `model`)
- `MemoryEntrySummary` type for list operations (excludes `content` field for honest typing)
- Pagination support on `agents.list()` and `memory.list()` via `ListOptions` (`limit`, `offset`)
- `PaginatedResult<T>` wrapper type with `items` and `pagination` (`{ limit, offset, hasMore }`)
- New `projects` namespace: `list()`, `get(projectId)`
- New `team` namespace: `listMembers()`, `invite()`, `addMember()`, `updateMemberRoles()`, `removeMember()`
- Rate limit `retryAfter` on `SaptApiError` for 429 responses
- JSDoc on `model` field listing supported models
- `typesVersions` in package.json for broader tooling compatibility

### Breaking Changes

- `agents.list()` now returns `PaginatedResult<AgentDefinition>` instead of `AgentDefinition[]`
- `memory.list()` now returns `PaginatedResult<MemoryEntrySummary>` instead of `MemoryEntry[]`

## 0.1.0

Initial release.

- `run()` — single-turn agent execution
- `stream()` — SSE streaming responses
- `conversation()` — multi-turn WebSocket sessions with automatic reconnection
- Agent definition CRUD (`agents.list`, `agents.create`, `agents.update`, `agents.delete`)
- Memory entry CRUD (`memory.list`, `memory.create`, `memory.update`, `memory.delete`)
- Pending action approval/rejection (`actions.approve`, `actions.reject`)
