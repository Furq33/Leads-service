import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST: retract a published lead. Calls the revoke_lead RPC, which removes
 * allocations and marks the lead retracted.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('leads')
    .select('id')
    .eq('id', params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'lead not found' }, { status: 404 });
  }

  const { error } = await admin.rpc('revoke_lead', { p_lead_id: params.id });
  if (error) {
    return NextResponse.json({ error: 'lead revocation failed' }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: user.id,
    action: 'lead.retracted',
    entityType: 'lead',
    entityId: params.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
