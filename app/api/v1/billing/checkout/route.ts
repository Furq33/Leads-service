import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { getStripe, isStripeConfigured, isPriceConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'http://localhost:3000';

/**
 * Create a Stripe Checkout Session (subscription mode) for the monthly plan.
 * Reuses the existing Stripe customer on the user's profile, or creates one
 * (email + metadata.user_id) and persists its id back to the profile.
 */
export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard.error) return guard.error;
  const { user } = guard;

  if (!checkRateLimit(req, 'billing:checkout', 20)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  if (!isStripeConfigured() || !isPriceConfigured()) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY as string;

  const supabase = createClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const stripe = getStripe();
  try {
    let customerId = (profile?.stripe_customer_id ?? null) as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      const admin = createAdminClient();
      const { error: persistError } = await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
      if (persistError) {
        return NextResponse.json(
          { error: 'could not save billing customer' },
          { status: 500 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/billing?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: 'could not create checkout session' },
      { status: 500 }
    );
  }
}
