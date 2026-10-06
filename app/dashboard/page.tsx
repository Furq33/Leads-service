export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatUSD, formatPct, formatDate, marginPct } from '@/lib/format';

type Lead = {
  id: string;
  title: string;
  buy_price: number;
  sell_price: number;
  supplier_link: string | null;
  listing_link: string | null;
  published_at: string | null;
};

function marginDollars(lead: Lead): number {
  return lead.sell_price - lead.buy_price;
}

export default async function DashboardPage() {
  let leads: Lead[] = [];
  let groupName: string | null = null;

  try {
    const supabase = createClient();
    // RLS enforces per-group visibility — this plain select only
    // returns leads assigned to the signed-in member's group.
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id, title, buy_price, sell_price, supplier_link, listing_link, published_at'
      )
      .order('published_at', { ascending: false });

    if (!error && data) {
      leads = (data as unknown as Lead[]).filter((l) => l && l.id);
    }

    // Show the member which group they're in.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: gm } = await supabase
        .from('group_members')
        .select('lead_groups(name)')
        .eq('user_id', user.id)
        .maybeSingle();
      const lg = (gm as { lead_groups?: { name?: string } | null } | null)
        ?.lead_groups;
      groupName = lg?.name ?? null;
    }
  } catch {
    leads = [];
  }

  const avgMargin =
    leads.length > 0
      ? leads.reduce((sum, l) => sum + marginPct(l.buy_price, l.sell_price), 0) /
        leads.length
      : 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            My Leads
          </h1>
          <p className="mt-1 text-slate-600">
            Exclusive opportunities for your group — every lead is shared with
            at most 5 members.
          </p>
          {groupName && (
            <p className="mt-2 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800">
              You&apos;re in {groupName}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <div className="text-xl font-extrabold text-slate-900">
              {leads.length}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Leads
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
            <div className="text-xl font-extrabold text-emerald-600">
              {formatPct(avgMargin)}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Avg margin
            </div>
          </div>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <h2 className="text-lg font-bold text-slate-900">
            No leads allocated yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            New leads are allocated as admins publish them. Check back soon —
            each lead is only ever shown to 5 subscribers.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h2 className="text-lg font-bold leading-snug text-slate-900">
                {lead.title}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Published {formatDate(lead.published_at)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Buy
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {formatUSD(lead.buy_price)}
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sell
                  </div>
                  <div className="text-base font-bold text-slate-900">
                    {formatUSD(lead.sell_price)}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Margin
                </span>
                <span className="text-base font-extrabold text-emerald-700">
                  {formatUSD(marginDollars(lead))} ·{' '}
                  {formatPct(marginPct(lead.buy_price, lead.sell_price))}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {lead.supplier_link && (
                  <a
                    href={lead.supplier_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Supplier ↗
                  </a>
                )}
                {lead.listing_link && (
                  <a
                    href={lead.listing_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Listing ↗
                  </a>
                )}
              </div>

              <Link
                href={`/dashboard/leads/${lead.id}`}
                className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                View details
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
