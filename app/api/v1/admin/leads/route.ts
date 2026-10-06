import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

const createLeadSchema = z.object({
  title: z.string().min(1, 'title is required').max(255),
  buy_price: z.number().positive('buy_price must be > 0'),
  sell_price: z.number().positive('sell_price must be > 0'),
  supplier_link: z.string().url('supplier_link must be a valid URL').optional().nullable(),
  listing_link: z.string().url('listing_link must be a valid URL').optional().nullable(),
  notes: z.string().optional().nullable(),
  max_viewers: z.number().int().positive('max_viewers must be > 0').optional().nullable(),
  expires_at: z.string().datetime('expires_at must be an ISO datetime').optional().nullable(),
});

/**
 * GET: list all leads, newest first. Optional ?status= filter.
 * POST: create a new lead in `draft` status, authored by the admin.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const status = req.nextUrl.searchParams.get('status');
  const admin = createAdminClient();
  let query = admin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ leads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from('leads')
    .insert({
      ...parsed.data,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: user.id,
    action: 'lead.created',
    entityType: 'lead',
    entityId: lead.id as string,
    metadata: { title: parsed.data.title },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
