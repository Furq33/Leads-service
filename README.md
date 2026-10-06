# LeadVault — Exclusive E-commerce Lead Distribution SaaS

A subscription-gated lead marketplace for Amazon/Walmart arbitrage. Admins publish
vetted leads (buy price, sell price, margin, supplier link, listing link) and each
lead is visible to at most **N** subscribers (default N = 5) — enforced at the
database layer via Supabase Row Level Security, not just application code.

**Stack:** Next.js 14 (App Router, TypeScript) · Supabase (Postgres + Auth + RLS) ·
Stripe Billing · Railway (web + worker services)

## Business rules (enforced)

- **Exclusivity = the product.** Default capacity N = 5, adjustable globally
  (`platform_settings.default_lead_capacity`) or per lead (`leads.max_viewers`).
- **RLS is the privacy boundary.** Subscribers can only `SELECT` leads they hold an
  active allocation for; allocation writes happen only via `SECURITY DEFINER`
  functions or the service-role key.
- **Stripe is the entitlement source of truth.** Webhooks mirror subscription state
  into `profiles.subscription_status`; middleware gates `/dashboard` and
  `/api/v1/leads*` on `active`/`trialing` (or `admin` role).
- **Old leads are never re-issued.** New subscribers only receive leads published
  after they subscribed; churned subscribers keep prior allocations but get nothing new.

## Getting started (local)

```bash
cd ~/workspace/leads-service
npm install
cp .env.example .env   # fill in real values (see below)
npm run dev            # web on http://localhost:3000
npm run worker         # allocation worker (separate terminal)
```

### 1. Supabase project

Create a project at [supabase.com](https://supabase.com), then apply migrations in order
— via the Supabase CLI (`supabase db push`) or the SQL editor:

```
supabase/migrations/2026100601_core.sql       # tables, indexes, constraints
supabase/migrations/2026100602_rls.sql        # RLS policies (privacy boundary)
supabase/migrations/2026100603_functions.sql  # allocate_lead / revoke_lead / expire_due_leads
supabase/migrations/2026100604_auth_trigger.sql # auto-create profile on signup
supabase/migrations/2026100605_seed.sql       # sample draft leads (dev only)
```

### 2. Environment variables

| Variable | Where | Secret? | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web | no | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | public-safe | Anon key (RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | web + worker | **yes** | Bypasses RLS — server only |
| `SUPABASE_URL` | worker | no | Same as above (worker naming) |
| `STRIPE_SECRET_KEY` | web | **yes** | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | web | **yes** | Webhook signature verification |
| `STRIPE_PRICE_ID_MONTHLY` | web | no | Monthly price ID |
| `NEXT_PUBLIC_APP_URL` | web | no | e.g. `http://localhost:3000` |
| `RESEND_API_KEY` | worker | **yes** | "New lead" emails (optional) |
| `RESEND_FROM_DOMAIN` | worker | no | Email sender domain (optional) |
| `SENTRY_DSN` | both | no | Error tracking (optional) |
| `LOG_LEVEL` | both | no | `debug`/`info`/`warn`/`error` |

For local Stripe webhooks: `stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe`.

### 3. Make yourself admin

After signing up, in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## Key flows

- **Subscribe:** `/billing` → Checkout → Stripe webhook `checkout.session.completed`
  sets `subscription_status = 'active'` → `/dashboard` unlocks.
- **Publish a lead:** `/admin` → create draft → Publish → `POST /api/v1/admin/leads/:id/publish`
  calls the `allocate_lead()` RPC, which atomically allocates the N least-recently-served
  active/trialing subscribers and flips the lead to `published`.
- **Expiry:** the worker runs `expire_due_leads()` every 15 minutes; retraction via
  `POST /api/v1/admin/leads/:id/retract` hides the lead instantly through RLS.

## API

Versioned under `/api/v1` — see the implementation plan for the full endpoint map.
Notable: `GET /api/v1/leads` (allocated feed, RLS-enforced), `POST /api/v1/webhooks/stripe`
(signature-verified, idempotent via `stripe_events`).

## Deploying on Railway

Two services from this repo:

| Service | Type | Start command | Notes |
|---|---|---|---|
| web | Web service | auto (Next.js) | Health check: `/api/healthz` |
| worker | Worker service | `npm run worker` | No public port; heartbeat log every 60s |

Map Railway environments → Supabase projects / Stripe keys:
production → Supabase prod + Stripe live; staging → Supabase staging + Stripe test.
Auto-deploy `main` → production. Alert if the worker heartbeat is missing for > 5 minutes.

## Project layout

```
app/                    # Pages: landing, login, dashboard, admin, billing
app/api/v1/             # REST API: auth, me, leads, billing, webhooks, admin
lib/                    # supabase clients, auth guards, stripe, rate-limit, format
middleware.ts           # Entitlement gate (UX layer; RLS is the real enforcement)
supabase/migrations/    # DDL, RLS, allocation functions, auth trigger, seed
worker/src/             # Allocation worker (allocate, expiry sweep, notifications)
```
