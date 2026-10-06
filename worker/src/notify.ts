import { createClient } from '@supabase/supabase-js';
import { log } from './log.js';

const supabase = createClient(
  process.env.SUPABASE_URL ?? 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder-service-role-key',
);

interface LeadRow {
  title: string;
}

interface ProfileRow {
  id: string;
  email: string;
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@');
}

async function fetchLeadTitle(leadId: string): Promise<string> {
  const { data, error } = await supabase
    .from('leads')
    .select('title')
    .eq('id', leadId)
    .single();
  if (error) throw new Error(`failed to fetch lead ${leadId}: ${error.message}`);
  return (data as LeadRow).title;
}

async function fetchUserEmails(userIds: string[]): Promise<string[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);
  if (error) throw new Error(`failed to fetch profiles: ${error.message}`);
  const rows = (data ?? []) as ProfileRow[];
  const emails = Array.from(new Set(rows.map((r) => r.email).filter(isEmail)));
  return emails;
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? '';
  const domain = process.env.RESEND_FROM_DOMAIN ?? 'example.com';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `LeadVault <leads@${domain}>`,
      to: [to],
      subject,
      text: body,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`resend responded ${response.status}: ${detail.slice(0, 200)}`);
  }
}

/**
 * Email the users a lead was allocated to. Fetches the lead title and each
 * user's email via the service-role key. Never throws: email failures are
 * logged as `notification_failed` and processing continues.
 */
export async function notifyAllocatedUsers(
  leadId: string,
  userIds: string[],
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    log('notification_skipped', {
      leadId,
      count: userIds.length,
      reason: 'resend_not_configured',
    });
    return;
  }
  if (userIds.length === 0) {
    log('notification_skipped', { leadId, count: 0, reason: 'no_recipients' });
    return;
  }
  try {
    const [title, emails] = await Promise.all([
      fetchLeadTitle(leadId),
      fetchUserEmails(userIds),
    ]);
    if (emails.length === 0) {
      log('notification_skipped', { leadId, count: 0, reason: 'no_emails_found' });
      return;
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const dashboardLink = `${appUrl}/dashboard`;
    const subject = `New exclusive lead: ${title}`;
    const body =
      `A new exclusive lead has been allocated to you:\n\n${title}\n\n` +
      `View it in your dashboard: ${dashboardLink}`;
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      try {
        await sendEmail(email, subject, body);
        sent += 1;
      } catch (err) {
        failed += 1;
        log('notification_failed', {
          leadId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    log('notification_sent', { leadId, sent, failed });
  } catch (err) {
    log('notification_failed', {
      leadId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
