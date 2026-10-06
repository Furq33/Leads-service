import { createClient } from '@supabase/supabase-js';
import { log } from './log.js';

const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
);

/** Sweep expired leads. Returns number expired. */
export async function sweepExpiredLeads(): Promise<number> {
  const { data, error } = await supabase.rpc('expire_due_leads');
  if (error) throw new Error(`expire_due_leads failed: ${error.message}`);
  const count = (data ?? 0) as number;
  log('expiry_sweep', { expired: count });
  return count;
}
