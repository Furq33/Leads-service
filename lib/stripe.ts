import Stripe from 'stripe';

/**
 * Stripe SDK singleton.
 *
 * Build-safe: a placeholder key is used at import/build time so module
 * evaluation never throws. Routes must return a 503 JSON at runtime when
 * Stripe is not actually configured (see isStripeConfigured()).
 *
 * Secrets are never logged or exposed — they only travel inside SDK calls.
 */
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder'
    );
  }
  return stripe;
}

/** True only when a real (non-placeholder) Stripe secret key is present. */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return (
    !!key &&
    key !== 'sk_test_placeholder' &&
    key !== 'placeholder-stripe-secret-key'
  );
}

/** True only when a real (non-placeholder) webhook signing secret is present. */
export function isWebhookSecretConfigured(): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  return (
    !!secret &&
    secret !== 'whsec_placeholder' &&
    secret !== 'placeholder-webhook-secret'
  );
}

/** True only when a real (non-placeholder) monthly price ID is present. */
export function isPriceConfigured(): boolean {
  const price = process.env.STRIPE_PRICE_ID_MONTHLY;
  return !!price && price !== 'price_placeholder_monthly';
}
