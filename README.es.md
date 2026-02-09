# EstateFlow AI

Plataforma CRM inmobiliaria potenciada por IA para agentes de ventas. Conversaciones en tiempo real, resumenes generados por IA, priorizacion de leads y panel de analiticas.

**Demo en vivo:** https://estateflow-web-5tjias2ehq-uc.a.run.app/

> [README in English](./README.md)

## Vista General de la Arquitectura

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Navegador   │◄───►│  Next.js 15  │◄───►│ PostgreSQL   │
│  React 19     │ WS  │  + Socket.IO │     │ + pgvector   │
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │ HTTP
                     ┌─────▼──────┐     ┌──────────────┐
                     │  FastAPI    │◄───►│    Redis      │
                     │  Servicio   │     │  (adaptador   │
                     │  IA (Python)│     │   Socket.IO)  │
                     └─────────────┘     └──────────────┘
```

| Servicio | Tecnologia | Puerto | Proposito |
|----------|------------|--------|-----------|
| **Web** | Next.js 15, React 19, TypeScript | 3000 | Aplicacion full-stack + servidor WebSocket |
| **Servicio IA** | FastAPI, LangChain, GPT-4o-mini | 8000 | Analisis de conversaciones + RAG |
| **Base de datos** | PostgreSQL 16 + pgvector | 5432 | Almacenamiento persistente + embeddings vectoriales |
| **Cache** | Redis 7 | 6379 | Adaptador Socket.IO para escalado horizontal |

## Funcionalidades Principales

- **Mensajeria en tiempo real** — Socket.IO con adaptador Redis, indicadores de escritura, actualizaciones sin recargar
- **Analisis IA** — Resumen, tags (16 categorias inmobiliarias) y prioridad generados despues de cada mensaje via llamadas debounced a GPT-4o-mini
- **RAG** — Documentos de proyectos embebidos con pgvector enriquecen el contexto de la IA
- **RBAC** — Admin ve todo; agentes solo ven sus conversaciones asignadas. Enforced a nivel API, no solo UI
- **Dashboard** — Total de conversaciones, sin responder, leads calientes, tiempo promedio de respuesta, ranking de agentes, distribucion por prioridad, top tags
- **i18n** — Ingles / Espanol con cambio instantaneo del lado del cliente (basado en cookies, sin prefijos en URL)
- **Responsive** — Diseno mobile-first con sidebar colapsable, paneles modales, listas virtualizadas

## Inicio Rapido

### Prerrequisitos

- Docker & Docker Compose
- API key de OpenAI

### 1. Clonar y configurar

```bash
git clone <repo-url> && cd EstateFlow-AI
cp .env.example .env
```

Edita `.env` y configura tu `OPENAI_API_KEY`:

```env
POSTGRES_USER=estateflow
POSTGRES_PASSWORD=estateflow_secret
POSTGRES_DB=estateflow
DATABASE_URL=postgresql://estateflow:estateflow_secret@db:5432/estateflow
REDIS_URL=redis://redis:6379

AUTH_SECRET=genera-un-secreto-aleatorio-aqui
NEXTAUTH_URL=http://localhost:3000

AI_SERVICE_URL=http://ai:8000
OPENAI_API_KEY=sk-tu-clave-aqui
```

### 2. Iniciar todo

```bash
docker compose up --build
```

Esto inicia los 4 servicios. El contenedor web ejecuta automaticamente `node-pg-migrate` al iniciar para aplicar migraciones pendientes y datos semilla.

### 3. Abrir la aplicacion

- **App**: http://localhost:3000
- **Salud IA**: http://localhost:8000/v1/health

### Credenciales de Demo

| Rol | Email | Contrasena |
|-----|-------|------------|
| Admin | admin@estateflow.com | password123 |
| Agente | maria@estateflow.com | password123 |
| Agente | pedro@estateflow.com | password123 |

El Admin ve las 8 conversaciones. Maria ve 4, Pedro ve 4 (solo sus leads asignados).

### Modo Desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build
```

Hot-reload habilitado para web (Next.js) e IA (uvicorn --reload).

## Estructura del Proyecto

```
EstateFlow-AI/
├── web/                          # Aplicacion full-stack Next.js
│   ├── app/                      # App Router paginas & rutas API
│   │   ├── (auth)/               # Layout de login
│   │   ├── (dashboard)/          # Layout protegido (sidebar)
│   │   └── api/                  # Endpoints REST API
│   ├── src/
│   │   ├── backend/              # Logica del servidor
│   │   │   ├── features/         # Modulos de dominio
│   │   │   │   ├── auth/         #   Autenticacion (NextAuth v5)
│   │   │   │   ├── conversations/#   Conversaciones + mensajes + trigger IA
│   │   │   │   ├── dashboard/    #   Queries de analiticas
│   │   │   │   ├── leads/        #   Gestion de leads
│   │   │   │   └── users/        #   Gestion de usuarios
│   │   │   └── server/
│   │   │       ├── lib/          #   withAuth, RBAC, ApiError, rate-limit
│   │   │       └── db/           #   Pool client, migraciones, seed
│   │   ├── frontend/             # Codigo del cliente
│   │   │   ├── components/       #   UI compartido (Button, Card, Select, etc.)
│   │   │   ├── features/         #   Componentes & hooks de dominio
│   │   │   ├── i18n/             #   Traducciones (EN/ES), contexto de locale
│   │   │   └── lib/              #   Utilidades, fetcher, tema
│   │   ├── shared/               # Compartido entre cliente y servidor
│   │   │   ├── types/            #   Interfaces TypeScript
│   │   │   ├── validations/      #   Esquemas Zod
│   │   │   └── routes/           #   Constantes de rutas
│   │   └── middleware.ts         # Guard de auth + deteccion de locale
│   ├── migrations/               # Migraciones SQL node-pg-migrate (up/down)
│   ├── server.ts                 # Servidor HTTP custom + Socket.IO
│   └── Dockerfile
├── ai-service/                   # Microservicio IA en Python
│   ├── app/
│   │   ├── api/routes.py         # /v1/analyze, /v1/ingest, /v1/health
│   │   ├── chains/               # Cadenas LangChain (resumen, tags, prioridad)
│   │   ├── rag/                  # Ingesta de documentos + busqueda vectorial
│   │   ├── services/             # Orquestacion del analizador
│   │   └── config.py             # Configuracion Pydantic
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml            # Produccion
└── docker-compose.dev.yml        # Desarrollo (hot-reload)
```

## Arquitectura del Backend

### Diseno por Capas

```
Manejador de Ruta API  →  Servicio  →  Repositorio  →  Base de Datos
     (validacion)         (logica de     (queries SQL)
                           negocio + RBAC)
```

- **Manejadores** parsean requests, validan con Zod, delegan a servicios
- **Servicios** enforzan reglas de negocio y autorizacion (`assertConversationAccess`)
- **Repositorios** ejecutan queries SQL parametrizados via pool de conexiones `pg`
- La clase **`ApiError`** con metodos factory (`notFound`, `forbidden`, `unauthorized`) asegura respuestas HTTP de error consistentes

### Autorizacion

```typescript
// Cada endpoint que modifica datos pasa por:
withAuth(handler)           // 1. Verificar sesion JWT
  → validateOrigin(req)     // 2. Check CSRF (origin vs host)
  → assertConversationAccess // 3. Admin pasa; agentes verificados contra assigned_agent_id
```

### Tiempo Real

`server.ts` custom envuelve Next.js con Socket.IO:

1. **Middleware de auth** — decodifica JWT de NextAuth desde cookies antes de permitir conexion
2. **Basado en salas** — clientes se unen a salas `conversation:{id}` despues de verificacion de acceso
3. **Eventos** — `new_message`, `ai_update`, `typing` se transmiten a los miembros de la sala
4. **Adaptador Redis** — opcional, habilita escalado horizontal multi-instancia

## Capa de IA

### Como Funciona

Despues de cada mensaje, `debouncedTriggerAIAnalysis()` se dispara (debounce de 2s) y llama al servicio IA en Python:

```
Mensaje guardado → Debounce 2s → Obtener mensajes → POST /v1/analyze
     │                                                    │
     │                              ┌─────────────────────┤
     │                              ▼                     ▼
     │                        asyncio.gather()      Contexto RAG
     │                        ┌─────┬─────┐        (pgvector)
     │                        ▼     ▼     ▼
     │                     Resumen Tags Prioridad
     │                        └─────┴─────┘
     │                              │
     └── Broadcast WebSocket ◄──── UPDATE conversations SET ai_summary, ai_tags, ai_priority
```

### Cadenas

| Cadena | Modelo | Temp | Salida |
|--------|--------|------|--------|
| **Resumen** | GPT-4o-mini | 0.3 | Analisis de 3-5 oraciones en espanol |
| **Tags** | GPT-4o-mini | 0.0 | Array JSON de 16 tags validos |
| **Prioridad** | GPT-4o-mini | 0.0 | `high` / `medium` / `low` |

Las tres se ejecutan concurrentemente via `asyncio.gather()`.

### RAG (Generacion Aumentada por Recuperacion)

Los documentos de proyectos se fragmentan (600 caracteres, 100 de solapamiento), se embeben con `text-embedding-3-small` y se almacenan en pgvector. Cuando una conversacion menciona un nombre de proyecto, los fragmentos relevantes se recuperan (top-4 similitud coseno) y se inyectan en el prompt de resumen para analisis con contexto.

### Taxonomia de Tags

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

### Estrategia de Reintentos

Las llamadas IA fallidas se reintentan con backoff exponencial (2s, 4s, 8s — maximo 3 intentos). Errores no reintentables (4xx) abortan inmediatamente. La API de mensajes nunca se bloquea por la IA — el analisis es fire-and-forget.

## Migraciones de Base de Datos

Los cambios de schema se gestionan con [node-pg-migrate](https://github.com/salsita/node-pg-migrate). Cada archivo de migracion contiene secciones **Up** y **Down** para soporte completo de rollback. La tabla `pgmigrations` registra cuales migraciones se han aplicado.

```bash
npm run db:migrate          # Aplicar todas las migraciones pendientes
npm run db:migrate:down     # Revertir la ultima migracion
npm run db:migrate:create   # Crear un nuevo archivo de migracion
```

Las migraciones se ejecutan automaticamente al iniciar el contenedor (tanto en el Dockerfile de produccion como en docker-compose de desarrollo). En arranques posteriores, solo se ejecutan las migraciones no aplicadas.

## Esquema de Base de Datos

```sql
users          (id, name, email, password_hash, role[admin|agent])
leads          (id, name, email, phone, project_interest, source, budget, assigned_agent_id)
conversations  (id, lead_id, assigned_agent_id, status, ai_summary, ai_priority, ai_tags[], last_message_at)
messages       (id, conversation_id, sender_type[agent|lead], sender_id, content, content_type[text|image], is_read)
project_embeddings (id, project_name, chunk_text, embedding vector(1536), metadata jsonb)
```

Indices clave: GIN en `ai_tags[]`, B-tree en `ai_priority`, indice parcial en mensajes no leidos, indice compuesto en `(conversation_id, created_at)`.

## Decisiones Clave y Tradeoffs

| Decision | Por que | Tradeoff |
|----------|---------|----------|
| **i18n basado en cookies** (sin prefijos /en/, /es/) | Evita reestructurar todo el App Router; cambio instantaneo del lado del cliente | Requiere gestion de cookies de locale; no optimizado para SEO multilingue |
| **server.ts custom** en vez del built-in de Next.js | Socket.IO necesita acceso a la instancia del servidor HTTP | Pierde algunas optimizaciones de Next.js (modo standalone, binding automatico de puerto) |
| **GPT-4o-mini** en vez de GPT-4o | 10x mas barato, suficientemente rapido para resumenes/tags | Calidad ligeramente menor en analisis con matices |
| **SQL directo (pg) + node-pg-migrate** | Control total sobre queries, sin overhead de ORM; migraciones trackeadas con rollback | Construccion manual de queries; requiere disciplina en la escritura de migraciones |
| **IA con debounce (2s)** | Previene llamadas excesivas a la API durante conversacion rapida | El analisis se retrasa ligeramente respecto al ultimo mensaje |
| **Servicio IA separado en Python** | El ecosistema LangChain es Python-first; escalado independiente | Contenedor extra, salto de red, complejidad de despliegue |
| **Adaptador Redis opcional** | Funciona en modo single-instance sin Redis | Debe habilitarse Redis para despliegues multi-instancia |
| **SWR** para data fetching | Cache integrado, revalidacion, actualizaciones optimistas | El estado del servidor y el cache pueden divergir brevemente |

## Seguridad

- **Hashing de contrasenas**: bcryptjs (factor de costo 12)
- **Sesiones**: NextAuth v5 estrategia JWT, TTL de 24h
- **CSRF**: Validacion de header Origin en requests no-GET
- **XSS**: Sanitizador `stripHtml()` en inputs de texto del usuario
- **Inyeccion SQL**: Queries parametrizados en todo el proyecto
- **Headers**: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy
- **Limites de request**: 1 MB max body, rate limiting (Redis primario, fallback en memoria)
- **Auth del servicio IA**: API key opcional via header `X-API-Key`
- **Docker**: Builds multi-etapa, usuarios sin privilegios en runtime

## Stack Tecnologico

### Web
Next.js 15 | React 19 | TypeScript | Tailwind CSS 4 | Socket.IO | SWR | next-intl | next-auth v5 | Zod | react-hook-form | date-fns | lucide-react

### Servicio IA
FastAPI | LangChain | OpenAI GPT-4o-mini | pgvector | text-embedding-3-small | Pydantic | uvicorn

### Infraestructura
PostgreSQL 16 + pgvector | Redis 7 | Docker Compose | Dockerfiles multi-etapa
