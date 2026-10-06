import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

type AllocationRow = {
  allocated_at: string;
  user_id: string;
  profiles: Array<{ email: string | null }> | null;
};

/**
 * GET: allocations for one lead (?lead_id= required), joined with the
 * allocated users' emails, ordered by allocation time.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const leadId = req.nextUrl.searchParams.get('lead_id');
  if (!leadId) {
    return NextResponse.json(
      { error: 'lead_id query parameter is required' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lead_allocations')
    .select('allocated_at, user_id, profiles(email)')
    .eq('lead_id', leadId)
    .order('allocated_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as AllocationRow[]).map((row) => ({
    lead_id: leadId,
    user_id: row.user_id,
    email: row.profiles?.[0]?.email ?? null,
    allocated_at: row.allocated_at,
  }));

  return NextResponse.json({ allocations: rows });
}
