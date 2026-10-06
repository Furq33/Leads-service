import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/app/api/v1/_lib/audit';
import { cancelCustomerSubscriptions } from '@/app/api/v1/_lib/cancel-subscriptions';

export const dynamic = 'force-dynamic';

/**
 * DELETE: permanently delete the signed-in user's own account.
 * Any active Stripe subscription is cancelled first. The profile, group
 * membership and related rows cascade from the auth user deletion.
 */
export async function DELETE(req: NextRequest) {
  const guard = await requireUser();
  if (guard.error) return guard.error;

  if (!checkRateLimit(req, 'account:delete', 5)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('email, stripe_customer_id')
    .eq('id', guard.user.id)
    .maybeSingle();

  const email = (profile as { email?: string } | null)?.email ?? null;

  await cancelCustomerSubscriptions(
    (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id
  );

  // audit_log.actor_id references profiles without cascade — detach this
  // user's rows first so the cascade delete below doesn't hit a FK violation.
  await admin
    .from('audit_log')
    .update({ actor_id: null })
    .eq('actor_id', guard.user.id);

  await logAudit(admin, {
    actorId: null,
    action: 'user.self_deleted',
    entityType: 'user',
    entityId: guard.user.id,
    metadata: { email },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    guard.user.id
  );
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
