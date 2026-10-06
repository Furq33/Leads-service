export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatUSD, formatPct, formatDate, marginPct } from '@/lib/format';

type Lead = {
  id: string;
  title: string;
  buy_price: number;
  sell_price: number;
  supplier_link: string | null;
  listing_link: string | null;
  notes: string | null;
  max_viewers: number | null;
  published_at: string | null;
  expires_at: string | null;
};

async function getLead(id: string): Promise<Lead | null> {
  try {
    const supabase = createClient();
    // RLS enforces per-subscriber visibility.
    const { data, error } = await supabase
      .from('leads')
      .select(
        'id, title, buy_price, sell_price, supplier_link, listing_link, notes, max_viewers, published_at, expires_at'
      )
      .eq('id', id)
      .single();
    if (error || !data) return null;
    return data as unknown as Lead;
  } catch {
    return null;
  }
}

export default async function LeadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const lead = await getLead(params.id);
  if (!lead) notFound();

  const marginDollars = lead.sell_price - lead.buy_price;
  const margin = marginPct(lead.buy_price, lead.sell_price);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Back to My Leads
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
        {lead.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Published {formatDate(lead.published_at)}
        {lead.expires_at && ` · Expires ${formatDate(lead.expires_at)}`}
        {typeof lead.max_viewers === 'number' &&
          ` · Shared with at most ${lead.max_viewers} subscribers`}
      </p>

      {/* Price / margin panel */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Buy price
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatUSD(lead.buy_price)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sell price
          </div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatUSD(lead.sell_price)}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">
            Margin
          </div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-700">
            {formatUSD(marginDollars)} · {formatPct(margin)}
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Notes
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
            {lead.notes}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {lead.supplier_link && (
          <a
            href={lead.supplier_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-indigo-600 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Buy from supplier ↗
          </a>
        )}
        {lead.listing_link && (
          <a
            href={lead.listing_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            View listing ↗
          </a>
        )}
      </div>
    </main>
  );
}
