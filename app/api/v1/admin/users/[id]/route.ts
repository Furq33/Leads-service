import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/app/api/v1/_lib/audit';
import { cancelCustomerSubscriptions } from '@/app/api/v1/_lib/cancel-subscriptions';

export const dynamic = 'force-dynamic';

/**
 * DELETE: permanently delete a user account (admin only).
 * Deletes the auth user; the profile, group membership and related rows
 * cascade. Any active Stripe subscription is cancelled first. An admin
 * cannot delete their own account.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  if (!checkRateLimit(req, 'admin:delete_user', 20)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  if (params.id === guard.user.id) {
    return NextResponse.json(
      { error: 'you cannot delete your own admin account' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, role, stripe_customer_id')
    .eq('id', params.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  const p = profile as {
    email?: string;
    role?: string;
    stripe_customer_id?: string | null;
  };

  await cancelCustomerSubscriptions(p.stripe_customer_id);

  // audit_log.actor_id references profiles without cascade — detach this
  // user's rows first so the cascade delete below doesn't hit a FK violation.
  await admin
    .from('audit_log')
    .update({ actor_id: null })
    .eq('actor_id', params.id);

  const { error: deleteError } = await admin.auth.admin.deleteUser(params.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: guard.user.id,
    action: 'user.deleted',
    entityType: 'user',
    entityId: params.id,
    metadata: { email: p.email ?? null, role: p.role ?? null },
  });

  return NextResponse.json({ ok: true });
}
