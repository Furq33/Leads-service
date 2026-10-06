import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { getStripe, isWebhookSecretConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

type AdminClient = ReturnType<typeof createAdminClient>;

function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

/**
 * Period bounds for a subscription. In the current Stripe API version the
 * period lives on the subscription item, so read it from the first item
 * (null when the payload doesn't include one).
 */
function subscriptionPeriod(sub: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const item = sub.items?.data?.[0];
  return {
    start: toIso(item?.current_period_start),
    end: toIso(item?.current_period_end),
  };
}

/** Resolve a subscription id from an invoice (new API: via parent details). */
function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const ref =
    invoice.parent?.subscription_details?.subscription ?? null;
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.id;
}

async function handleEvent(admin: AdminClient, event: Stripe.Event): Promise<void> {
  const stripe = getStripe();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      if (!userId || !session.subscription) return;

      await admin
        .from('profiles')
        .update({
          stripe_customer_id: session.customer as string,
          subscription_status: 'active',
        })
        .eq('id', userId);

      const full = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const period = subscriptionPeriod(full);
      await admin.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_subscription_id: full.id,
          stripe_customer_id: full.customer as string,
          status: full.status,
          current_period_start: period.start,
          current_period_end: period.end,
          cancel_at_period_end: full.cancel_at_period_end,
        },
        { onConflict: 'stripe_subscription_id' }
      );
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const deleted = event.type === 'customer.subscription.deleted';
      const status = deleted ? 'canceled' : sub.status;
      const period = subscriptionPeriod(sub);

      await admin
        .from('subscriptions')
        .update({
          status,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: period.end,
        })
        .eq('stripe_subscription_id', sub.id);

      // Mirror the status onto the owning profile.
      const { data: subRow } = await admin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle();
      const userId =
        (subRow?.user_id as string | undefined) ??
        (sub.metadata?.user_id as string | undefined);
      if (userId) {
        await admin
          .from('profiles')
          .update({ subscription_status: status })
          .eq('id', userId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(invoice);
      let userId: string | undefined = invoice.metadata?.user_id as
        | string
        | undefined;
      if (!userId && subId) {
        const { data: subRow } = await admin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subId)
          .maybeSingle();
        userId = subRow?.user_id as string | undefined;
      }
      if (userId) {
        await admin
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId);
      }
      break;
    }

    default:
      // Unknown/unhandled event types are acknowledged and ignored.
      break;
  }
}

/**
 * Stripe webhook endpoint.
 * - Verifies the signature against the raw request body.
 * - Deduplicates via the stripe_events table (idempotent retries safe).
 * - All DB writes use the service-role client (Stripe is the entitlement
 *   source of truth, independent of any user session).
 */
export async function POST(req: NextRequest) {
  if (!checkRateLimit(req, 'stripe:webhook', 60)) {
    return NextResponse.json({ error: 'rate limit exceeded' }, { status: 429 });
  }

  if (!isWebhookSecretConfigured()) {
    return NextResponse.json(
      { error: 'webhook not configured' },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch {
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: seen } = await admin
    .from('stripe_events')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle();

  if (!seen) {
    await handleEvent(admin, event);
    await admin
      .from('stripe_events')
      .insert({ event_id: event.id, type: event.type });
  }

  return NextResponse.json({ ok: true });
}
