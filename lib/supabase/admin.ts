import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for privileged server-side work
 * (webhooks, cron jobs, admin APIs that bypass RLS).
 *
 * SERVER-SIDE ONLY — never import from client components. The service-role
 * key has full database access and must never reach the browser.
 *
 * Placeholder fallbacks mean module evaluation never throws during build —
 * the app can be compiled with zero env vars configured. Routes using this
 * client must return a 503 JSON at runtime when the real key is absent.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key'
  );
}
