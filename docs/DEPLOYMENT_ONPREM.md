# On-Premises Deployment Guide

This guide covers deploying OpenClaw Command Center on your own infrastructure.

## Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | LTS recommended (20.x or 22.x) |
| npm | 9+ | Comes with Node.js |
| Docker | 20+ | Only needed for PostgreSQL mode |
| Docker Compose | v2+ | Only needed for PostgreSQL mode |

## Quick Start

```powershell
# Clone the repository
git clone https://github.com/your-org/openclaw-command-center.git
cd openclaw-command-center

# Run setup (installs deps, creates .env, sets up database)
.\scripts\setup.ps1

# Start development server
.\scripts\dev.ps1
```

Open `http://localhost:3000` in your browser. Register a new account and you are ready to go.

## Database Modes

### SQLite Mode (Default, Zero Config)

SQLite is the default database and requires no external services. The database file is stored at `prisma/dev.db`.

This is the recommended mode for:
- Local development
- Single-user deployments
- Quick evaluation and testing

No configuration changes needed. The default `.env` uses:

```
DATABASE_URL="file:./dev.db"
```

### PostgreSQL Mode (Docker Compose)

For multi-user or production deployments, switch to PostgreSQL.

**Step 1: Start PostgreSQL with Docker Compose**

```powershell
docker compose up -d
```

This starts a PostgreSQL 16 instance on port 5432 with the credentials defined in `docker-compose.yml`.

**Step 2: Update `.env`**

Comment out the SQLite URL and uncomment the PostgreSQL URL:

```env
# DATABASE_URL="file:./dev.db"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/openclaw_cc?schema=public"
```

**Step 3: Update Prisma Schema**

In `prisma/schema.prisma`, change the provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 4: Push the Schema**

```powershell
npx prisma db push
```

## Production Deployment

### Step 1: Build

```powershell
.\scripts\build.ps1
```

This runs `prisma generate` and `next build` to create an optimized production bundle.

### Step 2: Configure Environment

Set all required environment variables for production. At minimum:

```env
DATABASE_URL="postgresql://user:password@db-host:5432/openclaw_cc?schema=public"
NEXTAUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="https://your-domain.com"
ENCRYPTION_KEY="<32 hex characters>"
OPENCLAW_WEBHOOK_SECRET="<strong random secret>"
```

### Step 3: Run Database Migration

```powershell
npx prisma db push
```

### Step 4: Start the Server

```powershell
.\scripts\run-prod.ps1
```

Or directly:

```powershell
$env:NODE_ENV = "production"
npx next start
```

The server starts on port 3000 by default. Use a reverse proxy (nginx, Caddy, IIS) to add TLS and expose on port 443.

### Step 5: Reverse Proxy (Example with nginx)

```nginx
server {
    listen 443 ssl;
    server_name command-center.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string (SQLite or PostgreSQL) |
| `NEXTAUTH_SECRET` | Yes | - | Secret for signing session tokens. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Base URL of the application |
| `ENCRYPTION_KEY` | Yes | - | 32 hex-character key for encrypting OpenClaw API tokens at rest |
| `OPENCLAW_WEBHOOK_SECRET` | Yes | - | Shared secret for verifying incoming webhooks from OpenClaw |
| `OPENCLAW_DEFAULT_MODE` | No | `mock` | Default OpenClaw mode for new workspaces (`mock` or `real`) |
| `OPENCLAW_DEFAULT_BASE_URL` | No | `http://localhost:8787` | Default OpenClaw instance URL for new workspaces |
| `OPENCLAW_DEFAULT_HEALTH_PATH` | No | `/health` | Default health check path for new workspaces |

## Troubleshooting

### Database connection fails

- **SQLite**: Ensure the `prisma/` directory exists and is writable. Check that `DATABASE_URL` starts with `file:`.
- **PostgreSQL**: Verify Docker is running (`docker ps`), check credentials match `.env`, and confirm the port is not in use.

### Port 3000 already in use

```powershell
# Find what is using port 3000
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object OwningProcess
Get-Process -Id <PID>
```

Or start on a different port:

```powershell
npx next dev -p 3001
```

### Prisma client out of date

If you see errors about missing Prisma models or fields:

```powershell
npx prisma generate
npx prisma db push
```

### Build fails with TypeScript errors

```powershell
npx next lint
```

Fix any reported issues, then rebuild.

### Docker Compose issues

```powershell
# View logs
docker compose logs postgres

# Reset the database volume
docker compose down -v
docker compose up -d
```
