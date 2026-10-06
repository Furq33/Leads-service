import { getStripe, isStripeConfigured } from '@/lib/stripe';

/**
 * Cancel all active/trialing Stripe subscriptions for a customer, so deleting
 * an account never leaves a live subscription charging with no account
 * behind it. Best-effort: logs and continues on failure.
 */
export async function cancelCustomerSubscriptions(
  stripeCustomerId: string | null | undefined
): Promise<void> {
  if (!stripeCustomerId || !isStripeConfigured()) return;
  try {
    const stripe = getStripe();
    for (const status of ['active', 'trialing'] as const) {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status,
        limit: 20,
      });
      for (const sub of subs.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }
  } catch (err) {
    console.error(
      '[cancelCustomerSubscriptions] failed for customer',
      stripeCustomerId,
      err instanceof Error ? err.message : err
    );
  }
}
