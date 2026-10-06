import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Server-side Supabase client (Server Components / Route Handlers).
 *
 * Placeholder fallbacks mean module evaluation never throws during build —
 * the app can be compiled with zero env vars configured.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component where set is not allowed; the
            // middleware refreshes the session cookie instead.
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}
