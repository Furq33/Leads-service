import Link from 'next/link';
import SampleLeadCard from '@/components/SampleLeadCard';
import { SAMPLE_LEADS } from '@/lib/sample-leads';

export const metadata = {
  title: 'Sample Leads — LeadVault',
  description:
    'See what a LeadVault lead looks like. Vetted buy price, sell price, and margin — each shown to one group of 5 members.',
};

export default function SampleLeadsPage() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-20">
          <p className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Take a peek inside
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            This is what members see.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            Every LeadVault lead shows the vetted buy price, sell price, and
            margin up front — plus the exact supplier and listing links
            members use to act in minutes. Below are illustrative examples of
            the format.
          </p>
        </div>
      </section>

      {/* Example cards */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {SAMPLE_LEADS.map((lead) => (
            <SampleLeadCard key={lead.id} lead={lead} />
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Examples shown for illustration only — not real opportunities.
        </p>

        {/* Exclusivity callout */}
        <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-indigo-600 p-8 text-center text-white">
          <p className="text-lg font-semibold">
            Notice the seat counters?
          </p>
          <p className="mt-2 text-indigo-100">
            Each lead is allocated to at most five subscribers. When the fifth
            seat fills, the lead closes for good — the exact links are never
            shown to a sixth person. That is what keeps every margin real.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Get exclusive leads — $150/month
          </Link>
          <p className="mt-3 text-sm text-slate-500">
            Cancel anytime · Secure checkout
          </p>
        </div>
      </section>
    </main>
  );
}
