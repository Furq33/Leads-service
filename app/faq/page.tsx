import Link from 'next/link';

export const metadata = {
  title: 'FAQ — LeadVault',
  description:
    'Frequently asked questions about LeadVault: exclusivity, allocation, marketplaces, pricing, and cancellation.',
};

const faqs = [
  {
    q: 'How do you keep leads from getting saturated?',
    a: 'Every lead is allocated to a maximum of 5 subscribers. Once the fifth seat fills, the lead is closed permanently and never shown to anyone else — so you are never competing with hundreds of other sellers on the same product.',
  },
  {
    q: 'How are leads allocated between members?',
    a: 'When a lead publishes, it is offered to eligible subscribers through a fair rotation: members who received leads least recently get priority. This keeps distribution balanced instead of rewarding only the fastest clickers.',
  },
  {
    q: 'What marketplaces do the leads target?',
    a: 'Leads are built for Amazon and Walmart arbitrage. We show you exactly where to buy (the supplier link) and where the verified sell price comes from (the listing link), so you can move fast.',
  },
  {
    q: 'What does a lead actually include?',
    a: 'Each lead shows the product, the vetted buy price and where to buy it, the verified sell price and where to list it, and the calculated margin in dollars and percent — plus the direct supplier and listing links members use to act in minutes.',
  },
  {
    q: 'How often are new leads published?',
    a: 'Leads publish as they are found and vetted — there is no fixed schedule, because real opportunities don’t follow one. Your dashboard always shows what’s currently actionable; expired leads are swept automatically.',
  },
  {
    q: 'What happens when a lead’s 5 seats fill up?',
    a: 'The lead is marked closed. Its buy/sell details are never shown to a sixth subscriber, which is exactly what keeps the margin from collapsing under competition.',
  },
  {
    q: 'How much does it cost?',
    a: 'One plan: $150/month. Every member sees the same vetted opportunities — no tiers, no upsells. Cancel anytime from your billing page and keep access until the end of your billing period.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. Cancel anytime from your billing page. There are no contracts and no cancellation fees, and you keep access until the end of your current billing period.',
  },
];

export default function FaqPage() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-3xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-20">
          <p className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            FAQ
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Questions, answered.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            Everything about exclusivity, allocation, pricing, and how
            LeadVault works.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="space-y-4">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="font-bold text-slate-900">{f.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/login"
            className="inline-block rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Join LeadVault — $150/month
          </Link>
          <p className="mt-3 text-sm text-slate-500">
            Or{' '}
            <Link
              href="/sample-leads"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              preview example leads
            </Link>{' '}
            first.
          </p>
        </div>
      </section>
    </main>
  );
}
