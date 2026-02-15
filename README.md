# OpenClaw Command Center

Full-stack Kanban Command Center with OpenClaw integration. Manage tasks on drag-and-drop boards, run commands against OpenClaw instances, receive webhook updates, and export wiring packs for seamless connectivity.

## Features

- **Kanban Boards** -- Create boards with customizable columns, drag-and-drop tasks, set priorities and labels
- **Command Center** -- Built-in terminal panel for executing commands (`openclaw.health`, `repo.scan`, `md.index`, `routes.validate`, `tests.run`, `task.sync`, `wiring.export`)
- **OpenClaw Integration** -- Connect to real OpenClaw instances or use mock mode for development
- **Webhook Receivers** -- Receive job status updates and log entries from OpenClaw
- **Wiring Pack Export** -- Generate ZIP bundles with contracts, prompts, and configs for OpenClaw
- **API Contract Endpoint** -- Machine-readable contract at `/api/openclaw/contract` (no auth required)
- **Diagnostics Dashboard** -- View database status, environment variables, routes, and connection health
- **User Authentication** -- Email/password registration and login with encrypted token storage
- **SQLite by Default** -- Zero-config database; optional PostgreSQL via Docker Compose

## Quick Start

```powershell
# Clone the repository
git clone https://github.com/your-org/openclaw-command-center.git
cd openclaw-command-center

# Run setup (installs dependencies, creates .env, sets up database)
.\scripts\setup.ps1

# Start development server
.\scripts\dev.ps1
```

Open `http://localhost:3000`, register an account, and start using the Kanban board.

## Scripts

| Script | Description |
|---|---|
| `.\scripts\setup.ps1` | Install dependencies, create `.env`, set up database |
| `.\scripts\dev.ps1` | Start development server |
| `.\scripts\build.ps1` | Generate Prisma client and build for production |
| `.\scripts\run-prod.ps1` | Start production server |
| `.\scripts\test.ps1` | Run linting and Playwright E2E tests |
| `.\scripts\db-reset.ps1` | Delete and recreate the database (with confirmation) |

## Screenshots

<!-- Add screenshots here -->
_Coming soon_

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI + shadcn/ui patterns |
| Drag & Drop | @hello-pangea/dnd |
| Database | Prisma ORM (SQLite default, PostgreSQL optional) |
| Authentication | NextAuth.js v5 (credentials provider) |
| Validation | Zod |
| E2E Testing | Playwright |
| CI/CD | GitHub Actions |

## Project Structure

```
openclaw-command-center/
  .github/workflows/     GitHub Actions CI pipeline
  docs/
    CONTRACTS.md          API contracts reference
    DEPLOYMENT_ONPREM.md  On-premises deployment guide
    OPENCLAW_WIRING_GUIDE.md  Step-by-step OpenClaw wiring
    TROUBLESHOOTING.md    Common issues and solutions
  prisma/
    schema.prisma         Database schema
  scripts/
    setup.ps1             Setup script
    dev.ps1               Dev server
    build.ps1             Production build
    run-prod.ps1          Production server
    test.ps1              Run tests
    db-reset.ps1          Database reset
  src/
    app/
      api/                API routes
        auth/             Registration and NextAuth
        boards/           Board CRUD
        command-center/   Command execution and history
        diagnostics/      System diagnostics
        openclaw/         OpenClaw config, contract, dispatch, webhooks
        tasks/            Task CRUD and movement
      page.tsx            Landing/login page
      layout.tsx          Root layout
    components/           React components
    lib/
      auth.ts             Authentication helpers
      encryption.ts       Token encryption
      prisma.ts           Prisma client
      validators.ts       Zod schemas
      openclaw/           OpenClaw client, mock, types
      wiring/             Wiring pack templates
  tests/
    e2e/
      smoke.spec.ts       Smoke tests (register, login, boards, tasks, commands)
      contract.spec.ts    Contract endpoint validation tests
  playwright.config.ts    Playwright configuration
  docker-compose.yml      PostgreSQL (optional)
  .env.example            Environment variable template
```

## Documentation

- [On-Premises Deployment](docs/DEPLOYMENT_ONPREM.md) -- Full deployment guide with SQLite and PostgreSQL options
- [OpenClaw Wiring Guide](docs/OPENCLAW_WIRING_GUIDE.md) -- Step-by-step connection setup
- [API Contracts](docs/CONTRACTS.md) -- Complete API reference with request/response schemas
- [Troubleshooting](docs/TROUBLESHOOTING.md) -- Common issues and solutions

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string |
| `NEXTAUTH_SECRET` | Yes | Session signing secret |
| `NEXTAUTH_URL` | Yes | Application base URL |
| `ENCRYPTION_KEY` | Yes | 32 hex chars for token encryption |
| `OPENCLAW_WEBHOOK_SECRET` | Yes | Shared secret for webhook auth |

See [`.env.example`](.env.example) for all available variables.

## License

Private -- All rights reserved.
