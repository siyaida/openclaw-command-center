# Product Roadmap

## Phase 1 — MVP (Current Build)

### Auth & Onboarding
- [x] Email/password authentication (NextAuth Credentials)
- [x] User registration with workspace auto-creation
- [x] Default board + columns (To Do, In Progress, Done)
- [x] OpenClaw setup wizard (onboarding page)
- [x] openclaw_bot assignee identity

### Kanban Core
- [x] Boards CRUD (create, list, update, delete)
- [x] Columns CRUD with reordering
- [x] Tasks CRUD with all fields (title, description, priority, labels, dueDate, assignee)
- [x] Drag-and-drop tasks between columns (@hello-pangea/dnd)
- [x] Task activity log
- [x] Priority badges (low/medium/high)
- [x] Assignee display (me / openclaw_bot)

### Command Center
- [x] Right-side panel with command input
- [x] Preset command buttons (7 commands)
- [x] Output console with formatted JSON
- [x] Connection badge (Connected/Disconnected/Misconfigured)
- [x] Command history (persisted to DB)
- [x] Commands: openclaw.health, repo.scan, md.index, routes.validate, tests.run, wiring.export, task.sync

### OpenClaw Connector
- [x] Adapter pattern (client.ts) with mock + real mode
- [x] Mock mode with deterministic stubs
- [x] Real mode with HTTP calls + token auth
- [x] Health handshake with configurable path
- [x] Timeouts + retries
- [x] Token encryption at rest (AES-256-CBC)

### Wiring Pack
- [x] SYSTEM_PROMPT_OPENCLAW_COMMAND_CENTER.md template
- [x] TOOLS_CONTRACT.md with full schemas
- [x] JOBS_AND_TASKS_MAPPING.md
- [x] WEBHOOKS.md with curl examples
- [x] PROMPTS_LIBRARY.md (5 parameterized templates)
- [x] ZIP export endpoint
- [x] In-UI generation

### API Contracts & Webhooks
- [x] POST /api/openclaw/webhook/job-status
- [x] POST /api/openclaw/webhook/log
- [x] GET /api/openclaw/contract (machine-readable JSON)
- [x] POST /api/openclaw/dispatch
- [x] X-OPENCLAW-SECRET header verification

### Diagnostics
- [x] DB status check
- [x] Env vars status
- [x] OpenClaw config display
- [x] Health check with latency
- [x] Registered commands list
- [x] Contract preview

### Infrastructure
- [x] SQLite database (zero-config default)
- [x] PostgreSQL support via Docker Compose
- [x] PowerShell scripts (setup, dev, test, build, run-prod, db-reset)
- [x] OpenClaw discovery PowerShell commands in settings
- [x] GitHub Actions CI
- [x] Playwright smoke tests
- [x] Contract tests
- [x] Full documentation (4 docs)

## Phase 2 — Enhanced Integration
- [ ] Real-time OpenClaw job status polling
- [ ] Task auto-assignment based on OpenClaw recommendations
- [ ] Batch task sync to OpenClaw
- [ ] Command output streaming
- [ ] Prompt template editor in UI
- [ ] Wiring pack validation against live OpenClaw instance

## Phase 3 — Collaboration & Scale
- [ ] Multi-user workspaces with invites
- [ ] WebSocket-based real-time updates
- [ ] Role-based permissions
- [ ] Board templates
- [ ] Advanced filtering and search
- [ ] Task dependencies visualization

## Phase 4 — Intelligence
- [ ] OpenClaw-powered task suggestions
- [ ] Automated code review via Command Center
- [ ] Sprint planning assistant
- [ ] Burndown charts and velocity metrics
- [ ] Vector DB memory for context retention

## Dependencies & Notes
- OpenClaw instance required for real mode (mock mode works standalone)
- PostgreSQL via Docker optional (SQLite default for simplicity)
- All wiring documentation auto-generated and exportable
