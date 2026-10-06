import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Single lead by id, visible only when allocated to the session user.
 * Returns 404 for both "does not exist" and "not allocated to you" —
 * never 403, so existence is not confirmed for unallocated leads.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireUser();
  if (guard.error) return guard.error;

  const supabase = createClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: 'lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}
