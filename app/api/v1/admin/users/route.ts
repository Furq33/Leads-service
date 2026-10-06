import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET: list all user profiles with their group (admin only).
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select(
      'id, email, role, subscription_status, created_at, group_members(lead_groups(id, name))'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const users = (data ?? []).map((p) => {
    const gm = (p as { group_members?: unknown[] }).group_members as
      | { lead_groups: { id: string; name: string } | null }[]
      | undefined;
    const group = gm?.[0]?.lead_groups ?? null;
    return {
      id: p.id as string,
      email: p.email as string,
      role: p.role as string,
      subscription_status: p.subscription_status as string,
      created_at: p.created_at as string,
      group: group ? { id: group.id, name: group.name } : null,
    };
  });

  return NextResponse.json({ users });
}
