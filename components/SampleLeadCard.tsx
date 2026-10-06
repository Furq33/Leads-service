import Link from 'next/link';
import { formatUSD, formatPct, marginPct } from '@/lib/format';
import type { SampleLead } from '@/lib/sample-leads';

/**
 * Advertisement-style lead card for public pages. Shows the money math
 * openly but keeps the actionable links locked behind membership.
 */
export default function SampleLeadCard({ lead }: { lead: SampleLead }) {
  const margin = lead.sellPrice - lead.buyPrice;
  const pct = marginPct(lead.buyPrice, lead.sellPrice);
  const closed = lead.seatsTaken >= lead.seatsTotal;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          {lead.category}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            closed
              ? 'bg-slate-100 text-slate-600'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {closed
            ? 'Closed — 5/5 seats taken'
            : `${lead.seatsTaken}/${lead.seatsTotal} seats taken`}
        </span>
      </div>

      <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">
        {lead.title}
      </h3>
      <p className="mt-1 text-xs text-slate-500">
        Example lead · vetted {lead.publishedLabel}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Buy · {lead.buySource}
          </div>
          <div className="text-base font-bold text-slate-900">
            {formatUSD(lead.buyPrice)}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Sell · {lead.sellSource}
          </div>
          <div className="text-base font-bold text-slate-900">
            {formatUSD(lead.sellPrice)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-emerald-700">
          Margin
        </span>
        <span className="text-base font-extrabold text-emerald-700">
          {formatUSD(margin)} · {formatPct(pct)}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">{lead.note}</p>

      {/* Locked actionable links */}
      <div className="relative mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div className="select-none space-y-1.5 blur-[3px]" aria-hidden="true">
          <p className="text-xs font-medium text-slate-500">
            Supplier: walmart.com/ip/sony-wh1000xm5-clearance-88412
          </p>
          <p className="text-xs font-medium text-slate-500">
            Listing: amazon.com/dp/B09XS7JWHH
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            🔒 Members see the exact links
          </Link>
        </div>
      </div>
    </article>
  );
}
