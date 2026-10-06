import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET: list all groups with their members (admin only).
 */
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('lead_groups')
    .select(
      'id, name, created_at, group_members(joined_at, profiles(id, email, subscription_status))'
    )
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const groups = (data ?? []).map((g) => {
    const members = ((g as { group_members?: unknown[] }).group_members ??
      []) as {
      joined_at: string;
      profiles: { id: string; email: string; subscription_status: string } | null;
    }[];
    return {
      id: g.id as string,
      name: g.name as string,
      created_at: g.created_at as string,
      member_count: members.length,
      members: members.map((m) => ({
        id: m.profiles?.id ?? null,
        email: m.profiles?.email ?? null,
        subscription_status: m.profiles?.subscription_status ?? null,
        joined_at: m.joined_at,
      })),
    };
  });

  return NextResponse.json({ groups });
}
