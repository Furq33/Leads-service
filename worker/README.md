# LeadVault allocation worker

Background service for exclusive lead distribution. It calls the Postgres
SECURITY DEFINER functions (`allocate_lead`, `expire_due_leads`) through the
Supabase service-role key on a schedule — it never talks to the database
directly, and it never exposes a port.

## What it does

- **Expiry sweep** (every 15 minutes): calls `expire_due_leads()` to expire
  due leads. Logs `expiry_sweep` with the count, or `sweep_failed` on error.
- **Heartbeat** (every 60 seconds): logs `heartbeat` so monitoring can prove
  the service is alive.
- **Manual allocation**: `--allocate <leadId>` allocates one lead once via
  `allocate_lead(p_lead_id)` (idempotent, row-locked), sends notification
  emails to the allocated users via Resend, then exits.

On boot the worker logs `worker_started` with env presence flags (booleans
only — secrets are never logged). If `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
look unconfigured, it logs a warning and idles on heartbeat only, so the
service doesn't crash-loop in unconfigured environments.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service-role key (bypasses RLS; used only for RPC calls and internal reads) |
| `LOG_LEVEL` | No | `debug` / `info` (default) / `warn` / `error` |
| `RESEND_API_KEY` | No | If set, sends "New exclusive lead" emails via Resend. If absent, notifications are skipped (logged as `notification_skipped`) and allocation still succeeds. |
| `RESEND_FROM_DOMAIN` | No | Domain in the From header (`leads@<domain>`). Default: `example.com`. |
| `NEXT_PUBLIC_APP_URL` | No | Base URL used to build the dashboard link in notification emails. |

## Run locally

```bash
# long-running service (heartbeat + expiry sweep)
npm run worker

# allocate a single lead once, then notify and exit
npm run worker -- --allocate <leadId>

# debug logging
LOG_LEVEL=debug npm run worker
```

Type-check: `npx tsc --noEmit`

## Railway deployment notes

- Create a **worker** (not web) service from this repo; a worker service needs
  no exposed port.
- Start command: `npm run worker`.
- Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the service's env vars
  (plus `RESEND_API_KEY` / `RESEND_FROM_DOMAIN` / `NEXT_PUBLIC_APP_URL` as needed).
- Set `LOG_LEVEL=info` for production JSON logs; Railway forwards stdout to the
  log stream.
- Alerting: heartbeat is emitted every 60 seconds — page if no `heartbeat` line
  appears for more than 5 minutes.
- Graceful shutdown: SIGTERM/SIGINT clears timers and exits 0; Railway rolling
  deploys won't leave duplicate sweep intervals running.
