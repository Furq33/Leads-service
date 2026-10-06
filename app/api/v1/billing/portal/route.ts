import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getStripe, isStripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

/**
 * Create a Stripe billing portal session for the current user's customer.
 * Requires the profile to already carry a stripe_customer_id (set by
 * checkout or the Stripe webhook).
 */
export async function POST() {
  const guard = await requireUser();
  if (guard.error) return guard.error;
  const { user } = guard;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 });
  }

  const supabase = createClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    return NextResponse.json(
      { error: 'no billing customer on file' },
      { status: 400 }
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/billing`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: 'could not create billing portal session' },
      { status: 500 }
    );
  }
}
