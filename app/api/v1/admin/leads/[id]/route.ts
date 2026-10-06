import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

const updateLeadSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    buy_price: z.number().positive().optional(),
    sell_price: z.number().positive().optional(),
    supplier_link: z.string().url().optional().nullable(),
    listing_link: z.string().url().optional().nullable(),
    notes: z.string().optional().nullable(),
    max_viewers: z.number().int().positive().optional().nullable(),
    expires_at: z.string().datetime().optional().nullable(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'at least one field is required',
  });

/**
 * PATCH: update a lead — only while it is still a draft.
 * Published/retracted leads are immutable via this endpoint.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    );
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
      { error: 'only draft leads can be updated' },
      { status: 400 }
    );
  }

  const { data: lead, error } = await admin
    .from('leads')
    .update(parsed.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: user.id,
    action: 'lead.updated',
    entityType: 'lead',
    entityId: params.id,
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ lead });
}
