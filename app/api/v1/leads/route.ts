import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Paginated feed of leads allocated to the current user.
 * The server client is RLS-scoped to the session user, so only that
 * user's allocated leads are ever returned — no extra filtering needed.
 */
export async function GET(req: NextRequest) {
  const guard = await requireUser();
  if (guard.error) return guard.error;

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(params.get('limit') ?? '20', 10) || 20)
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createClient();
  const { data, count, error } = await supabase
    .from('leads')
    .select(
      'id,title,buy_price,sell_price,margin,margin_pct,supplier_link,listing_link,notes,published_at,expires_at',
      { count: 'exact' }
    )
    .order('published_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    leads: data ?? [],
    page,
    limit,
    total: count ?? 0,
  });
}
