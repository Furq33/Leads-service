import { createClient } from '@supabase/supabase-js';
import { log } from './log.js';

const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
);

/** Allocate a newly published lead to N eligible subscribers. Idempotent. */
export async function allocateLead(leadId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('allocate_lead', { p_lead_id: leadId });
  if (error) throw new Error(`allocate_lead failed for ${leadId}: ${error.message}`);
  const userIds = (data ?? []) as string[];
  log('lead_allocated', { leadId, count: userIds.length });
  return userIds;
}

/** Sweep expired leads. Returns number expired. */
export async function sweepExpiredLeads(): Promise<number> {
  const { data, error } = await supabase.rpc('expire_due_leads');
  if (error) throw new Error(`expire_due_leads failed: ${error.message}`);
  const count = (data ?? 0) as number;
  log('expiry_sweep', { expired: count });
  return count;
}
