import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

const roleSchema = z.object({
  role: z.enum(['admin', 'user']),
});

/**
 * POST: set a user's role (promote to admin or demote to user).
 * An admin cannot demote themselves.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => ({}));
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    );
  }

  if (params.id === guard.user.id && parsed.data.role !== 'admin') {
    return NextResponse.json(
      { error: 'you cannot remove your own admin access' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from('profiles')
    .select('id, email, role')
    .eq('id', params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }

  const { error } = await admin
    .from('profiles')
    .update({ role: parsed.data.role })
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: guard.user.id,
    action: 'user.role_changed',
    entityType: 'user',
    entityId: params.id,
    metadata: {
      email: (existing as { email?: string }).email ?? null,
      from: (existing as { role?: string }).role ?? null,
      to: parsed.data.role,
    },
  });

  return NextResponse.json({ id: params.id, role: parsed.data.role });
}
