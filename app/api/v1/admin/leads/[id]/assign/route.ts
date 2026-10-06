import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

const assignSchema = z.object({
  group_id: z.string().uuid('group_id must be a valid UUID'),
});

/**
 * POST: assign a lead to a group. The lead is marked published and becomes
 * visible to exactly the members of that group (max 5).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  if (!checkRateLimit(req, 'admin:assign', 30)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: lead } = await admin
    .from('leads')
    .select('id, status, title, published_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: 'lead not found' }, { status: 404 });
  }
  if ((lead as { status: string }).status === 'retracted') {
    return NextResponse.json(
      { error: 'retracted leads cannot be assigned' },
      { status: 400 }
    );
  }

  const { data: group } = await admin
    .from('lead_groups')
    .select('id, name')
    .eq('id', parsed.data.group_id)
    .maybeSingle();

  if (!group) {
    return NextResponse.json({ error: 'group not found' }, { status: 404 });
  }

  const { data: updated, error } = await admin
    .from('leads')
    .update({
      assigned_group_id: parsed.data.group_id,
      status: 'published',
      published_at: (lead as { published_at: string | null }).published_at ?? new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: user.id,
    action: 'lead.assigned',
    entityType: 'lead',
    entityId: params.id,
    metadata: {
      title: (lead as { title?: string }).title ?? null,
      group_id: parsed.data.group_id,
      group_name: (group as { name?: string }).name ?? null,
    },
  });

  return NextResponse.json({ lead: updated });
}
