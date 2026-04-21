# webdev-crm

A small **Next.js** CRM for a **freelance web‑development** outreach workflow: track leads, scripts, touchpoints, and tasks in **PostgreSQL**, prioritize who to contact today, and optionally use an **AI assistant** (Groq + Vercel AI SDK) to suggest outreach, scripts, and enrichment.

## What it is for

- **Lead pipeline** — Companies with tier, status, contact fields, next action, and a **3‑touch** cadence mindset (`totalTouches`).
- **Scripts** — Cold email / call / follow‑up templates per tier, with **performance scores** derived from touchpoints.
- **Touchpoints** — Log each email or call and outcome back to leads and scripts.
- **Today’s list** — Deterministic ranking for “who to work today” within a **20–30** daily cap (`UserSettings.maxDailyOutreach`).
- **Enrichment** — Queue **Enrichment** tasks for high‑tier leads missing email or phone.
- **AI panel** — Chat commands and streaming **structured JSON** (recommended leads, scripts, enrich candidates) when `GROQ_API_KEY` is set.

This is a focused internal tool, not a full multi‑tenant SaaS.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma** + **PostgreSQL** (`DATABASE_URL`)
- **Vercel AI SDK** + **`@ai-sdk/groq`** + **`@ai-sdk/react`** (optional streaming assistant)

## Quick start

1. **PostgreSQL** — Create a database (Docker, Neon, Supabase, local, etc.).

2. **Environment** — Copy `.env.example` to `.env` and set at least:

   | Variable | Required | Purpose |
   |----------|----------|---------|
   | `DATABASE_URL` | Yes | Postgres connection string (**Prisma requires this name** in `schema.prisma`) |
   | `GROQ_API_KEY` | No | Powers `POST /api/ai/chat` (streaming). Without it, that route returns **503**; the rest of the app works |

3. **Install and create tables**

   This repo includes **`prisma/migrations`** — apply them so API routes do not return 500:

   ```bash
   npm install
   npm run db:deploy
   ```

   For local development with new migration files:

   ```bash
   npm run db:migrate
   ```

   Quick prototype **without** migration files (not recommended if you use `migrate deploy` in prod):

   ```bash
   npm run db:push
   ```

4. **Seed** (optional — sample leads and scripts when tables are empty):

   ```bash
   npm run db:seed
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

   **Sanity check:** [http://localhost:3000/api/health](http://localhost:3000/api/health) should return `{ "ok": true, "database": "connected" }`. If not, fix `DATABASE_URL` and run **`npm run db:deploy`** again.

## How to use the app

1. **Leads** — Add or import leads (CSV on the dashboard). Set **tier** (1 = strongest fit, 5 = weakest) and **next action** so scripts can match.
2. **Scripts** — Maintain templates by **type** (cold email / cold call / follow‑up) and **tier**. Scores update from logged touchpoints.
3. **Touchpoints** — After outreach, record the touch so counts and script stats stay accurate.
4. **Today’s to‑do** — Uses rules similar to the AI context: eligible leads (not closed, under 3 touches), cap from settings, script match by tier + next action. Use **apply** actions from the UI to pin leads to **today’s list** (UTC day) via `DailyAppliedLead`.
5. **Dead / booked** — Move leads to terminal statuses when appropriate so they drop out of recommendations.
6. **AI assistant** (optional):
   - **`/today`** — Emphasis on today’s outreach list and script hints.
   - **`/enrich`** — Emphasis on high‑tier leads missing contact info.
   - **`/scripts`** — Emphasis on which scripts to lean on.
   - Natural language works too; the model receives a **JSON snapshot** of leads, scripts, touchpoints, pending tasks, and settings.
   - Buttons like **Create today’s list** and **Enrich these leads** call the same APIs as the rest of the dashboard (`/api/today-todo/apply`, `/api/enrichment/queue`).

**Deterministic fallback** — `POST /api/ai` returns rule‑based JSON (no LLM) for demos or when you do not use the streaming route.

## API overview

| Route | Role |
|-------|------|
| `GET/POST /api/leads` | CRUD leads |
| `GET/POST /api/scripts` | List / create scripts |
| `GET/POST /api/touchpoints` | Log touches |
| `GET /api/today-todo` | Today’s ranked list |
| `POST /api/today-todo/apply` | Body `{ "leadIds": number[] }` — pin to today (respects cap) |
| `POST /api/enrichment/queue` | Body `{ "leadIds": number[] }` — queue enrichment tasks |
| `GET/PATCH /api/user-settings` | Daily outreach cap (clamped 20–30 in logic) |
| `POST /api/ai` | Non‑streaming, deterministic assistant JSON |
| `POST /api/ai/chat` | Streaming structured object (Groq); requires `GROQ_API_KEY` |
| `GET /api/health` | Returns whether Postgres is reachable (`SELECT 1`) |

Streaming clients should use the **same Zod schema** as the server (`lib/crmAiSchema.ts`) with `experimental_useObject` from `@ai-sdk/react` (see `components/AIAssistantPanel.tsx`).

## Scripts (`package.json`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Next dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema without migrations |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (production / CI) |
| `npm run db:seed` | Seed sample data |

## Deploy (Vercel)

- Set **`DATABASE_URL`** (hosted Postgres). For Neon / many hosts, use the URL that supports **SSL** (often `?sslmode=require`). Prisma’s schema only reads **`DATABASE_URL`**; if your provider gives **`POSTGRES_URL`** only, paste the same value into **`DATABASE_URL`** in Vercel (the app needs it at **runtime** too). For one-off CLI runs, `POSTGRES_URL=... npm run db:deploy` works: `scripts/run-prisma.mjs` copies it when `DATABASE_URL` is unset.
- Set **`GROQ_API_KEY`** if you want the streaming AI route in production.
- **Apply migrations to the production database** (the app will 503 on all data routes until tables exist):

  ```bash
  DATABASE_URL="your-production-postgres-url" npm run db:deploy
  ```

  Or set Vercel **Build Command** to `npx prisma migrate deploy && npm run build` and ensure `DATABASE_URL` is exposed at **build** time (not only runtime), then redeploy.

- Build: `npm run build` (includes `prisma generate`).
- After deploy, open **`/api/health`** on your site to confirm the DB is connected.

## Data model (short)

Authoritative schema: **`prisma/schema.prisma`**.

- **`Lead`** — Company, contacts, `tier`, `status`, `totalTouches`, `nextAction`, enrichment fields.
- **`Script`** — Template content, `type`, `tier`, `performanceScore`, send/reply stats.
- **`Touchpoint`** — Outreach log (`leadId`, optional `scriptId`, outcome).
- **`Task`** — e.g. `Enrichment`, `Outreach`, `Tiering`; status pending/done/failed.
- **`DailyAppliedLead`** — Lead IDs applied to “today” for a given UTC date.
- **`UserSettings`** — Singleton `id = "default"`, `maxDailyOutreach`.

More detail: `docs/01-schema-and-tiering.md` … `docs/05-ui-and-endpoints.md` (product notes; Prisma wins if anything disagrees).

## Troubleshooting

- **Missing webpack chunk (e.g. `Cannot find module './611.js'`)** — Stop the server, delete the **`.next`** folder, run `npm run build` again. This repo sets **`outputFileTracingRoot`** in `next.config.ts` so Next does not treat a **parent folder** `package-lock.json` as the app root when you open the repo inside a larger `projects` directory.
- **Prisma `EPERM` on Windows** during `prisma generate` — Another process is locking the query engine; close other Node/IDE terminals using the project and retry.

## Legacy SQL

`db/migrations/001_init.sql` is an old sketch only. Use **Prisma migrations** for the real database.
