import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/** Count rows of a small text column into a { value: count } histogram. */
function tally(
  rows: Array<Record<string, unknown>> | null,
  field: string
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows ?? []) {
    const key = String(row[field] ?? 'unknown');
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/**
 * GET: platform-wide metrics snapshot —
 * profiles by subscription_status, leads by status, total active allocations,
 * and the count of subscriptions currently active or trialing.
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const admin = createAdminClient();
  const [
    { data: profiles, error: profilesError },
    { data: leads, error: leadsError },
    { count: activeAllocations, error: allocationsError },
    { count: activeSubscriptions, error: subscriptionsError },
  ] = await Promise.all([
    admin.from('profiles').select('subscription_status'),
    admin.from('leads').select('status'),
    admin
      .from('lead_allocations')
      .select('id', { count: 'exact', head: true }),
    admin
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'trialing']),
  ]);

  const firstError =
    profilesError ?? leadsError ?? allocationsError ?? subscriptionsError;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const profilesByStatus = tally(profiles, 'subscription_status');
  const leadsByStatus = tally(leads, 'status');

  return NextResponse.json({
    profiles: {
      total: profiles?.length ?? 0,
      by_subscription_status: profilesByStatus,
    },
    leads: {
      total: leads?.length ?? 0,
      by_status: leadsByStatus,
    },
    active_allocations: activeAllocations ?? 0,
    active_subscriptions: activeSubscriptions ?? 0,
  });
}
