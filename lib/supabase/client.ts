import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 *
 * Placeholder fallbacks mean module evaluation never throws during build —
 * the app can be compiled with zero env vars configured. Supabase calls
 * simply won't work until real env vars are provided at runtime.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  );
}
