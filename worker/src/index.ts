import { sweepExpiredLeads } from './allocate.js';
import { log } from './log.js';

const HEARTBEAT_INTERVAL_MS = 60_000;
const SWEEP_INTERVAL_MS = 15 * 60_000;
const PLACEHOLDER_TOKEN = 'placeholder';

/** True when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY hold real credentials. */
function isConfigured(): boolean {
  const url = process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!url || !key) return false;
  return !url.includes(PLACEHOLDER_TOKEN) && !key.includes(PLACEHOLDER_TOKEN);
}

/** Presence flags only — never secret values. */
function envPresenceFlags(): Record<string, boolean> {
  return {
    supabase_url: isConfigured(),
    supabase_service_role_key: isConfigured(),
    resend_api_key: Boolean(process.env.RESEND_API_KEY),
    next_public_app_url: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    log_level: Boolean(process.env.LOG_LEVEL),
  };
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Long-running heartbeat + expiry-sweep loop. */
function runService(): void {
  log('worker_started', envPresenceFlags());

  let heartbeatTimer: NodeJS.Timeout | undefined;
  let sweepTimer: NodeJS.Timeout | undefined;
  let sweepInFlight = false;

  if (!isConfigured()) {
    log(
      'worker_unconfigured',
      { reason: 'SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY look like placeholders; heartbeat only, no RPC calls' },
      'warn',
    );
  } else {
    sweepTimer = setInterval(() => {
      if (sweepInFlight) {
        log('sweep_skipped', { reason: 'previous_sweep_still_running' }, 'warn');
        return;
      }
      sweepInFlight = true;
      sweepExpiredLeads()
        .catch((err: unknown) => {
          log('sweep_failed', { error: errorMessage(err) }, 'error');
        })
        .finally(() => {
          sweepInFlight = false;
        });
    }, SWEEP_INTERVAL_MS);
    sweepTimer.unref();
  }

  heartbeatTimer = setInterval(() => {
    log('heartbeat', { uptime_s: Math.round(process.uptime()) });
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref();

  const shutdown = (signal: string): void => {
    log('worker_stopping', { signal });
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (sweepTimer) clearInterval(sweepTimer);
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

function main(): void {
  runService();
}

main();
