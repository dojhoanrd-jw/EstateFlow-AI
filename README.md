# EstateFlow AI

AI-powered real estate CRM platform for sales agents. Real-time conversations, AI-generated summaries, lead prioritization, and an analytics dashboard.

**Live Demo:** https://estateflow-web-5tjias2ehq-uc.a.run.app/

> [README en Espanol](./README.es.md)

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser     │◄───►│  Next.js 15  │◄───►│ PostgreSQL   │
│  React 19     │ WS  │  + Socket.IO │     │ + pgvector   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │ HTTP
                     ┌─────▼──────┐     ┌──────────────┐
                     │  FastAPI    │◄───►│    Redis      │
                     │  AI Service │     │  (Socket.IO   │
                     │  (Python)   │     │   adapter)    │
                     └─────────────┘     └──────────────┘
```

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| **Web** | Next.js 15, React 19, TypeScript | 3000 | Full-stack app + WebSocket server |
| **AI Service** | FastAPI, LangChain, GPT-4o-mini | 8000 | Conversation analysis + RAG |
| **Database** | PostgreSQL 16 + pgvector | 5432 | Persistent storage + vector embeddings |
| **Cache** | Redis 7 | 6379 | Socket.IO adapter for horizontal scaling |

## Key Features

- **Real-time messaging** — Socket.IO with Redis adapter, typing indicators, zero-refresh updates
- **AI analysis** — Summary, tags (16 real estate categories), and priority generated after every message via debounced GPT-4o-mini calls
- **RAG** — Project documents embedded with pgvector enrich AI context
- **RBAC** — Admin sees all; agents see only their assigned conversations. Enforced at API layer, not just UI
- **Dashboard** — Total conversations, unreplied count, hot leads, avg response time, agent leaderboard, priority distribution, top tags
- **i18n** — English / Spanish with instant client-side switching (cookie-based, no URL prefixes)
- **Responsive** — Mobile-first layout with collapsible sidebar, modal panels, virtualized lists

## Quick Start

### Prerequisites

- Docker & Docker Compose
- OpenAI API key

### 1. Clone and configure

```bash
git clone <repo-url> && cd EstateFlow-AI
cp .env.example .env
```

Edit `.env` and set your `OPENAI_API_KEY`:

```env
POSTGRES_USER=estateflow
POSTGRES_PASSWORD=estateflow_secret
POSTGRES_DB=estateflow
DATABASE_URL=postgresql://estateflow:estateflow_secret@db:5432/estateflow
REDIS_URL=redis://redis:6379

AUTH_SECRET=generate-a-random-secret-here
NEXTAUTH_URL=http://localhost:3000

AI_SERVICE_URL=http://ai:8000
OPENAI_API_KEY=sk-your-key-here
```

### 2. Start everything

```bash
docker compose up --build
```

This starts all 4 services. The web container automatically runs `node-pg-migrate` on startup to apply pending migrations and seed data.

### 3. Open the app

- **App**: http://localhost:3000
- **AI Health**: http://localhost:8000/v1/health

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@estateflow.com | password123 |
| Agent | maria@estateflow.com | password123 |
| Agent | pedro@estateflow.com | password123 |

Admin sees all 8 conversations. María sees 4, Pedro sees 4 (only their assigned leads).

### Development Mode

```bash
docker compose -f docker-compose.dev.yml up --build
```

Hot-reload enabled for both web (Next.js) and AI (uvicorn --reload).

## Project Structure

```
EstateFlow-AI/
├── web/                          # Next.js full-stack application
│   ├── app/                      # App Router pages & API routes
│   │   ├── (auth)/               # Login layout
│   │   ├── (dashboard)/          # Protected app layout (sidebar)
│   │   └── api/                  # REST API endpoints
│   ├── src/
│   │   ├── backend/              # Server-side logic
│   │   │   ├── features/         # Domain modules
│   │   │   │   ├── auth/         #   Authentication (NextAuth v5)
│   │   │   │   ├── conversations/#   Conversations + messages + AI trigger
│   │   │   │   ├── dashboard/    #   Analytics queries
│   │   │   │   ├── leads/        #   Lead management
│   │   │   │   └── users/        #   User management
│   │   │   └── server/
│   │   │       ├── lib/          #   withAuth, RBAC, ApiError, rate-limit
│   │   │       └── db/           #   Pool client, migrations, seed
│   │   ├── frontend/             # Client-side code
│   │   │   ├── components/       #   Shared UI (Button, Card, Select, etc.)
│   │   │   ├── features/         #   Domain components & hooks
│   │   │   ├── i18n/             #   Translations (EN/ES), locale context
│   │   │   └── lib/              #   Utils, fetcher, theme
│   │   ├── shared/               # Shared between client & server
│   │   │   ├── types/            #   TypeScript interfaces
│   │   │   ├── validations/      #   Zod schemas
│   │   │   └── routes/           #   Route constants
│   │   └── middleware.ts         # Auth guard + locale detection
│   ├── migrations/               # node-pg-migrate SQL migrations (up/down)
│   ├── server.ts                 # Custom HTTP server + Socket.IO
│   └── Dockerfile
├── ai-service/                   # Python AI microservice
│   ├── app/
│   │   ├── api/routes.py         # /v1/analyze, /v1/ingest, /v1/health
│   │   ├── chains/               # LangChain chains (summary, tags, priority)
│   │   ├── rag/                  # Document ingestion + vector search
│   │   ├── services/             # Analyzer orchestration
│   │   └── config.py             # Pydantic settings
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml            # Production
└── docker-compose.dev.yml        # Development (hot-reload)
```

## Backend Architecture

### Layered Design

```
API Route Handler  →  Service  →  Repository  →  Database
     (validation)    (business     (SQL queries)
                      logic + RBAC)
```

- **Handlers** parse requests, validate with Zod, delegate to services
- **Services** enforce business rules and authorization (`assertConversationAccess`)
- **Repositories** execute parameterized SQL queries via `pg` connection pool
- **`ApiError`** class with factory methods (`notFound`, `forbidden`, `unauthorized`) ensures consistent HTTP error responses

### Authorization

```typescript
// Every mutating endpoint goes through:
withAuth(handler)           // 1. Verify JWT session
  → validateOrigin(req)     // 2. CSRF check (origin vs host)
  → assertConversationAccess // 3. Admin passes; agents checked against assigned_agent_id
```

### Real-Time

Custom `server.ts` wraps Next.js with Socket.IO:

1. **Auth middleware** — decodes NextAuth JWT from cookies before allowing connection
2. **Room-based** — clients join `conversation:{id}` rooms after access check
3. **Events** — `new_message`, `ai_update`, `typing` broadcast to room members
4. **Redis adapter** — optional, enables multi-instance horizontal scaling

## AI Layer

### How It Works

After every message, `debouncedTriggerAIAnalysis()` fires (2s debounce) and calls the Python AI service:

```
Message saved → Debounce 2s → Fetch all messages → POST /v1/analyze
     │                                                    │
     │                              ┌─────────────────────┤
     │                              ▼                     ▼
     │                        asyncio.gather()      RAG context
     │                        ┌─────┬─────┐        (pgvector)
     │                        ▼     ▼     ▼
     │                     Summary Tags Priority
     │                        └─────┴─────┘
     │                              │
     └── WebSocket broadcast ◄──── UPDATE conversations SET ai_summary, ai_tags, ai_priority
```

### Chains

| Chain | Model | Temp | Output |
|-------|-------|------|--------|
| **Summary** | GPT-4o-mini | 0.3 | 3-5 sentence analysis in Spanish |
| **Tags** | GPT-4o-mini | 0.0 | JSON array from 16 valid tags |
| **Priority** | GPT-4o-mini | 0.0 | `high` / `medium` / `low` |

All three run concurrently via `asyncio.gather()`.

### RAG (Retrieval-Augmented Generation)

Project documents are chunked (600 chars, 100 overlap), embedded with `text-embedding-3-small`, and stored in pgvector. When a conversation mentions a project name, relevant chunks are retrieved (top-4 cosine similarity) and injected into the summary prompt for context-aware analysis.

### Tags Taxonomy

| Tag | EN | ES |
|-----|----|----|
| hot-lead | Hot Lead | Lead caliente |
| cold-lead | Cold Lead | Lead frio |
| pricing | Pricing | Precios |
| financing | Financing | Financiamiento |
| site-visit | Site Visit | Visita al sitio |
| follow-up | Follow Up | Seguimiento |
| urgent | Urgent | Urgente |
| investor | Investor | Inversionista |
| first-home | First Home | Primera vivienda |
| family | Family | Familiar |
| premium | Premium | Premium |
| comparison | Comparison | Comparativa |
| early-stage | Early Stage | Etapa inicial |
| infonavit | Infonavit | Infonavit |
| documentation | Documentation | Documentacion |
| negotiation | Negotiation | Negociacion |

### Retry Strategy

Failed AI calls retry with exponential backoff (2s, 4s, 8s — max 3 attempts). Non-retryable errors (4xx) abort immediately. The message API never blocks on AI — analysis is fire-and-forget.

## Database Migrations

Schema changes are managed with [node-pg-migrate](https://github.com/salsita/node-pg-migrate). Each migration file contains both **Up** and **Down** sections for full rollback support. The `pgmigrations` table tracks which migrations have been applied.

```bash
npm run db:migrate          # Apply all pending migrations
npm run db:migrate:down     # Rollback the last migration
npm run db:migrate:create   # Scaffold a new migration file
```

Migrations run automatically on container startup (both production Dockerfile and dev docker-compose). On subsequent boots, only unapplied migrations execute.

## Database Schema

```sql
users          (id, name, email, password_hash, role[admin|agent])
leads          (id, name, email, phone, project_interest, source, budget, assigned_agent_id)
conversations  (id, lead_id, assigned_agent_id, status, ai_summary, ai_priority, ai_tags[], last_message_at)
messages       (id, conversation_id, sender_type[agent|lead], sender_id, content, content_type[text|image], is_read)
project_embeddings (id, project_name, chunk_text, embedding vector(1536), metadata jsonb)
```

Key indexes: GIN on `ai_tags[]`, B-tree on `ai_priority`, partial index on unread messages, composite index on `(conversation_id, created_at)`.

## Key Decisions & Tradeoffs

| Decision | Why | Tradeoff |
|----------|-----|----------|
| **Cookie-based i18n** (no /en/, /es/ prefixes) | Avoids restructuring entire App Router; instant client-side switching | Requires locale cookie management; not SEO-optimized for multilingual content |
| **Custom server.ts** instead of Next.js built-in | Socket.IO needs access to the HTTP server instance | Loses some Next.js optimizations (standalone mode, automatic port binding) |
| **GPT-4o-mini** over GPT-4o | 10x cheaper, fast enough for summaries/tags | Slightly lower quality on nuanced analysis |
| **Direct SQL (pg) + node-pg-migrate** | Full control over queries, no ORM overhead; tracked migrations with rollback | Manual query building; requires discipline in migration authoring |
| **Debounced AI (2s)** | Prevents excessive API calls during rapid conversation | Analysis lags slightly behind the last message |
| **Separate Python AI service** | LangChain ecosystem is Python-first; independent scaling | Extra container, network hop, deployment complexity |
| **Redis adapter optional** | Works in single-instance mode without Redis | Must enable Redis for multi-instance deploys |
| **SWR** for data fetching | Built-in caching, revalidation, optimistic updates | Server state and cache can diverge briefly |

## Security

- **Password hashing**: bcryptjs (cost factor 12)
- **Sessions**: NextAuth v5 JWT strategy, 24h TTL
- **CSRF**: Origin header validation on non-GET requests
- **XSS**: `stripHtml()` sanitizer on user text inputs
- **SQL injection**: Parameterized queries throughout
- **Headers**: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy
- **Request limits**: 1 MB max body, rate limiting (Redis primary, in-memory fallback)
- **AI service auth**: Optional API key via `X-API-Key` header
- **Docker**: Multi-stage builds, unprivileged runtime users

## Tech Stack

### Web
Next.js 15 | React 19 | TypeScript | Tailwind CSS 4 | Socket.IO | SWR | next-intl | next-auth v5 | Zod | react-hook-form | date-fns | lucide-react

### AI Service
FastAPI | LangChain | OpenAI GPT-4o-mini | pgvector | text-embedding-3-small | Pydantic | uvicorn

### Infrastructure
PostgreSQL 16 + pgvector | Redis 7 | Docker Compose | Multi-stage Dockerfiles
