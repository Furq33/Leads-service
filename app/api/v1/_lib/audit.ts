import { createAdminClient } from '@/lib/supabase/admin';

type AdminClient = ReturnType<typeof createAdminClient>;

export type AuditEntityType = 'lead' | 'settings';

/**
 * Write one row to the audit_log table. Shared by admin route handlers.
 * Never throws the route off: failures are swallowed after a best-effort
 * insert so a logging hiccup can't turn a successful mutation into a 500.
 */
export async function logAudit(
  admin: AdminClient,
  input: {
    actorId: string;
    action: string;
    entityType: AuditEntityType;
    entityId: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await admin.from('audit_log').insert({
      actor_id: input.actorId,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Best-effort only.
  }
}
