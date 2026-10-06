import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAudit } from '@/app/api/v1/_lib/audit';

export const dynamic = 'force-dynamic';

const settingsSchema = z.object({
  default_lead_capacity: z
    .number()
    .int('default_lead_capacity must be an integer')
    .positive('default_lead_capacity must be > 0'),
});

/**
 * PATCH: upsert a platform setting. Currently supports
 * { default_lead_capacity: <positive int> }.
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { user } = guard;

  const body = await req.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join('; ') },
      { status: 400 }
    );
  }

  const key = 'default_lead_capacity';
  const value = parsed.data.default_lead_capacity;

  const admin = createAdminClient();
  const { error } = await admin
    .from('platform_settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(admin, {
    actorId: user.id,
    action: 'settings.updated',
    entityType: 'settings',
    entityId: key,
    metadata: { key, value },
  });

  return NextResponse.json({ key, value });
}
