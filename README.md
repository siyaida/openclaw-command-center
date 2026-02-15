<div align="center">

# OpenClaw Command Center

**The mission control for your OpenClaw AI agents.**

A full-stack Kanban board with a built-in Command Center that connects to [OpenClaw](https://github.com/openclaw) — run commands, monitor agent jobs, and auto-generate the entire wiring pack your agents need.

[![CI](https://github.com/siyaida/openclaw-command-center/actions/workflows/ci.yml/badge.svg)](https://github.com/siyaida/openclaw-command-center/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js_16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)

</div>

---

## Why This Exists

You have an OpenClaw instance. You need a way to:

1. **Manage tasks** — assign work to yourself or to `openclaw_bot`
2. **Send commands** — scan repos, index docs, validate routes, run tests
3. **Wire everything** — generate the prompts, contracts, and webhook configs OpenClaw needs
4. **See what's happening** — connection status, job results, diagnostics

This app does all four. It works in **mock mode** out of the box (no OpenClaw required), and switches to **real mode** when you plug in a live instance.

---

## Quick Start

```powershell
git clone https://github.com/siyaida/openclaw-command-center.git
cd openclaw-command-center

.\scripts\setup.ps1     # install deps, create .env, init SQLite
.\scripts\dev.ps1       # start at http://localhost:3000
```

Register an account. A default workspace, board, and three columns (To Do / In Progress / Done) are created automatically.

> **No Docker required.** SQLite is the default database — zero config. PostgreSQL is optional via `docker-compose.yml` if you need it later.

---

## What You Get

### Kanban Board

Drag-and-drop task management built for AI workflows.

- Boards with customizable columns
- Task cards with priority, labels, due dates, and assignee (`me` or `openclaw_bot`)
- Activity log per task
- Optimistic UI — moves feel instant

### Command Center

A terminal panel docked to the right side of the board.

| Command | What it does |
|---------|-------------|
| `openclaw.health` | Check if OpenClaw is reachable |
| `repo.scan` | Scan a repo for structure and issues |
| `md.index` | Index markdown documentation |
| `routes.validate` | Validate API routes |
| `tests.run` | Run test suites |
| `task.sync` | Sync Kanban tasks to OpenClaw jobs |
| `wiring.export` | Download the full wiring pack as ZIP |

Every command has Zod-validated request/response schemas and is logged with duration.

### OpenClaw Connector

An adapter with two modes:

| Mode | Behavior |
|------|----------|
| **Mock** (default) | Deterministic stubs. Everything works immediately. |
| **Real** | HTTP calls to your OpenClaw instance with encrypted token auth. |

Connection status is always visible: **Connected** / **Not Connected** / **Misconfigured** — with latency and version when connected.

### Wiring Pack Generator

The app generates everything OpenClaw needs to integrate — available in the UI and as a downloadable ZIP:

| File | Contents |
|------|----------|
| `SYSTEM_PROMPT_OPENCLAW_COMMAND_CENTER.md` | Agent role, tool contracts, behavioral rules |
| `TOOLS_CONTRACT.md` | Every command with endpoint, method, request/response schemas, examples |
| `JOBS_AND_TASKS_MAPPING.md` | How Kanban tasks map to OpenClaw jobs, state transitions |
| `WEBHOOKS.md` | Webhook endpoints with payload schemas and curl examples |
| `PROMPTS_LIBRARY.md` | 5 parameterized prompt templates (repo scan, MD index, route validation, test runner, suggest next move) |

### Machine-Readable Contract

```
GET /api/openclaw/contract
```

Returns the full tool contract as JSON — commands, schemas, webhooks, endpoints. No auth required. This is what makes deterministic wiring possible.

### Diagnostics

`/settings/diagnostics` shows everything at a glance:

- Database connection status
- Environment variables (set / missing)
- OpenClaw config and health check with latency
- Registered commands
- API routes
- Contract endpoint preview

---

## Finding Your OpenClaw Instance

The Settings page includes PowerShell discovery helpers, but here's the short version:

```powershell
# Is OpenClaw running?
Get-Process | Where-Object { $_.ProcessName -like "*openclaw*" -or $_.ProcessName -like "*wrangler*" }

# Is the port open?
Test-NetConnection -ComputerName localhost -Port 8787

# Start it (if you have the project)
cd path\to\openclaw
npx wrangler dev
```

Once found, enter the base URL and token in **Settings**, hit **Test Connection**, and you're wired.

---

## API Overview

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/auth/register` | Public | Create account + workspace |
| `GET/POST /api/boards` | User | Board CRUD |
| `GET/POST /api/boards/:id/columns` | User | Column CRUD + reorder |
| `POST /api/boards/:id/columns/:id/tasks` | User | Create task |
| `PUT /api/tasks/:id/move` | User | Drag-and-drop move |
| `POST /api/command-center/execute` | User | Run any command |
| `GET /api/command-center/history` | User | Command log |
| `GET/PUT /api/openclaw/config` | User | OpenClaw settings |
| `GET /api/openclaw/health` | User | Connection check |
| `GET /api/openclaw/wiring-pack` | Public | Download ZIP |
| `GET /api/openclaw/contract` | Public | Machine-readable contract |
| `POST /api/openclaw/webhook/job-status` | Secret | Job status callback |
| `POST /api/openclaw/webhook/log` | Secret | Log callback |
| `POST /api/openclaw/dispatch` | Secret | OpenClaw → app dispatch |
| `GET /api/diagnostics` | User | System diagnostics |

Webhook endpoints verify the `X-OPENCLAW-SECRET` header. Full schemas in [docs/CONTRACTS.md](docs/CONTRACTS.md).

---

## Scripts

| Script | What it does |
|--------|-------------|
| `.\scripts\setup.ps1` | Install deps, create `.env`, init database, print OpenClaw discovery commands |
| `.\scripts\dev.ps1` | Start dev server |
| `.\scripts\build.ps1` | Production build |
| `.\scripts\run-prod.ps1` | Start production server |
| `.\scripts\test.ps1` | Lint + Playwright E2E |
| `.\scripts\db-reset.ps1` | Drop and recreate database (asks for confirmation) |

---

## Environment Variables

Copy `.env.example` to `.env` — setup.ps1 does this automatically.

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | `file:./dev.db` | SQLite path or PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | — | Session signing key (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | App base URL |
| `ENCRYPTION_KEY` | Yes | — | 32 hex chars for AES-256 token encryption |
| `OPENCLAW_WEBHOOK_SECRET` | Yes | — | Shared secret for webhook auth |
| `OPENCLAW_DEFAULT_MODE` | No | `mock` | Default connector mode |
| `OPENCLAW_DEFAULT_BASE_URL` | No | — | Pre-fill OpenClaw URL |
| `OPENCLAW_DEFAULT_HEALTH_PATH` | No | `/health` | Custom health endpoint path |

---

## Project Structure

```
├── .github/workflows/ci.yml     CI pipeline (lint, build, e2e)
├── docs/
│   ├── CONTRACTS.md              Full API reference
│   ├── DEPLOYMENT_ONPREM.md      On-prem deployment guide
│   ├── OPENCLAW_WIRING_GUIDE.md  Step-by-step wiring walkthrough
│   └── TROUBLESHOOTING.md        Common issues + fixes
├── prisma/schema.prisma          Data model (9 tables)
├── scripts/*.ps1                 PowerShell automation
├── src/
│   ├── app/
│   │   ├── (auth)/               Login, Register
│   │   ├── (dashboard)/          Boards, Settings, Diagnostics, Onboarding
│   │   └── api/                  16 API route handlers
│   ├── components/
│   │   ├── kanban/               Board, Column, TaskCard, TaskDialog
│   │   └── command-center/       Panel, ConnectionBadge, OutputConsole
│   └── lib/
│       ├── openclaw/             Connector (client, mock, types, commands)
│       ├── wiring/               Wiring pack templates + ZIP generator
│       ├── auth.ts               NextAuth config
│       ├── encryption.ts         AES-256-CBC encrypt/decrypt
│       ├── prisma.ts             DB client
│       └── validators.ts         Zod schemas
├── tests/e2e/                    Playwright smoke + contract tests
├── ROADMAP.md                    Product roadmap
└── docker-compose.yml            PostgreSQL (optional)
```

---

## Tech Stack

| | Technology | Why |
|-|-----------|-----|
| Framework | **Next.js 16** (App Router) | Full-stack React with API routes |
| Language | **TypeScript** | Type safety everywhere |
| Styling | **Tailwind CSS** | Utility-first, dark theme |
| Components | **Radix UI** primitives | Accessible, unstyled |
| Drag & Drop | **@hello-pangea/dnd** | Maintained fork of react-beautiful-dnd |
| Database | **Prisma** + SQLite / PostgreSQL | Type-safe ORM, zero-config default |
| Auth | **NextAuth v5** (Credentials) | JWT sessions, server-side helpers |
| Validation | **Zod** | Runtime schema validation on every boundary |
| ZIP | **JSZip** | Wiring pack generation |
| Testing | **Playwright** | Cross-browser E2E |
| CI | **GitHub Actions** | Lint → Build → E2E pipeline |

---

## Documentation

| Document | Description |
|----------|-------------|
| [On-Prem Deployment](docs/DEPLOYMENT_ONPREM.md) | Full setup guide for SQLite and PostgreSQL modes |
| [OpenClaw Wiring Guide](docs/OPENCLAW_WIRING_GUIDE.md) | 8-step walkthrough from mock to fully wired |
| [API Contracts](docs/CONTRACTS.md) | Every endpoint with schemas and curl examples |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common errors and PowerShell diagnostic commands |
| [Roadmap](ROADMAP.md) | MVP checklist + future phases |

---

## License

Private — All rights reserved.
