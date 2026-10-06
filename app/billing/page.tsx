export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import CheckoutButton from '@/components/CheckoutButton';
import PortalButton from '@/components/PortalButton';

type Profile = {
  subscription_status: string | null;
  role: string | null;
  stripe_customer_id: string | null;
};

const ACTIVE = new Set(['active', 'trialing']);

function statusBadge(status: string | null) {
  const base =
    'inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize';
  if (status && ACTIVE.has(status))
    return `${base} bg-emerald-100 text-emerald-800`;
  if (status === 'past_due' || status === 'unpaid')
    return `${base} bg-amber-100 text-amber-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

async function getProfile(): Promise<Profile | null> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status, role, stripe_customer_id')
      .eq('id', user.id)
      .single();
    if (error || !data) return null;
    return data as unknown as Profile;
  } catch {
    return null;
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { checkout?: string };
}) {
  const profile = await getProfile();
  const isSubscribed =
    !!profile?.subscription_status && ACTIVE.has(profile.subscription_status);
  const showSuccess = searchParams.checkout === 'success';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Billing
      </h1>
      <p className="mt-1 text-slate-600">
        Manage your LeadVault subscription.
      </p>

      {showSuccess && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="font-semibold text-emerald-800">
            Subscription confirmed — welcome to LeadVault!
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Your exclusive leads are now unlocked in the dashboard.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Current plan status
            </h2>
            <div className="mt-2">
              <span className={statusBadge(profile?.subscription_status ?? null)}>
                {profile?.subscription_status ?? 'none'}
              </span>
            </div>
          </div>
        </div>

        {profile === null ? (
          <div className="mt-6 text-sm text-slate-600">
            <p>We could not load your billing details right now.</p>
            <Link
              href="/login"
              className="mt-2 inline-block font-medium text-indigo-600 hover:text-indigo-700"
            >
              Sign in to continue →
            </Link>
          </div>
        ) : isSubscribed ? (
          <div className="mt-6">
            <p className="text-sm text-slate-600">
              Your subscription is active. Use the customer portal to update
              payment details, change plans, or cancel.
            </p>
            <div className="mt-4">
              <PortalButton />
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-slate-900">
                LeadVault Pro — $49/month
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>✓ Exclusive allocation — max 5 subscribers per lead</li>
                <li>✓ Vetted buy price, sell price, and margin on every lead</li>
                <li>✓ Direct supplier and listing links</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
            <div className="mt-6">
              <CheckoutButton />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Secure checkout powered by Stripe. You can cancel anytime from
              this page.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to My Leads
        </Link>
      </div>
    </main>
  );
}
