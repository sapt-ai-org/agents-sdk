# Changelog

## 0.1.0

Initial release.

- `run()` — single-turn agent execution
- `stream()` — SSE streaming responses
- `conversation()` — multi-turn WebSocket sessions with automatic reconnection
- Agent definition CRUD (`agents.list`, `agents.create`, `agents.update`, `agents.delete`)
- Memory entry CRUD (`memory.list`, `memory.create`, `memory.update`, `memory.delete`)
- Pending action approval/rejection (`actions.approve`, `actions.reject`)
