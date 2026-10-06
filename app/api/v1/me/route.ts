import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Current user's profile plus their latest subscription.
 * Profile is read through the RLS-scoped server client; the subscription
 * lookup uses the service-role client (entitlement data is privileged).
 */
export async function GET() {
  const guard = await requireUser();
  if (guard.error) return guard.error;
  const { user } = guard;

  const supabase = createClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: 'profile not found' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ profile, subscription: subscription ?? null });
}
