import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';

/**
 * Shared auth guards for API route handlers.
 *
 * Handlers must not invent their own shapes: use getSessionUser(),
 * requireUser(), and requireAdmin() below, and return the guard's `error`
 * (an already-shaped JSON Response) when it is non-null.
 */

/** Server-side session user via the cookie-based client; null when signed out. */
export async function getSessionUser(): Promise<User | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export type AuthGuard =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Returns the session user, or a ready-made 401 JSON Response in `error`.
 *
 * Usage:
 *   const guard = await requireUser();
 *   if (guard.error) return guard.error;
 *   const { user } = guard;
 */
export async function requireUser(): Promise<AuthGuard> {
  const user = await getSessionUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    };
  }
  return { user, error: null };
}

/**
 * Returns the session user only when profiles.role === 'admin' for that user
 * (checked with the service-role client), otherwise a 401/403 JSON Response.
 */
export async function requireAdmin(): Promise<AuthGuard> {
  const guard = await requireUser();
  if (guard.error) return guard;

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from('profiles')
    .select('role')
    .eq('id', guard.user.id)
    .maybeSingle();

  if (error) {
    // A failing service-role lookup (e.g. mismatched SUPABASE_SERVICE_ROLE_KEY)
    // must not silently become a 403 — log it so the cause is diagnosable.
    console.error(
      '[requireAdmin] service-role profile lookup failed:',
      error.message
    );
    return {
      user: null,
      error: NextResponse.json(
        { error: 'admin check unavailable' },
        { status: 503 }
      ),
    };
  }

  if (!profile || profile.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  return guard;
}
