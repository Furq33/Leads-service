import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST: publish a draft lead. Calls the allocate_lead RPC, which marks the
 * lead published and allocates it to eligible subscribers. Returns the ids
 * of the users the lead was allocated to.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  if (!checkRateLimit(req, 'admin:publish', 20)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('leads')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'lead not found' }, { status: 404 });
  }
  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'only draft leads can be published' },
      { status: 400 }
    );
  }

  const { data, error } = await admin.rpc('allocate_lead', {
    p_lead_id: params.id,
  });
  if (error) {
    return NextResponse.json(
      { error: 'lead allocation failed' },
      { status: 500 }
    );
  }

  const allocatedUserIds: string[] = Array.isArray(data) ? data : [];

  await logAudit(admin, {
    actorId: user.id,
    action: 'lead.published',
    entityType: 'lead',
    entityId: params.id,
    metadata: { allocated_user_ids: allocatedUserIds },
  });

  return NextResponse.json({ lead_id: params.id, allocated_user_ids: allocatedUserIds });
}
