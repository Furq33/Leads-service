import Link from 'next/link';

export const metadata = {
  title: 'FAQ — LeadVault',
  description:
    'Frequently asked questions about LeadVault: exclusivity, allocation, marketplaces, pricing, and cancellation.',
};

const faqs = [
  {
    q: 'How do you keep leads from getting saturated?',
    a: 'Every lead is assigned to exactly one group of 5 members. Nobody outside your group ever sees it — so you are never competing with hundreds of other sellers on the same product.',
  },
  {
    q: 'How do the groups work?',
    a: 'When you subscribe, you are automatically placed into a group of 5 members. As new members join and a group fills, a new group forms. An admin assigns each lead to one specific group, and only those 5 members can view it.',
  },
  {
    q: 'What marketplaces do the leads target?',
    a: 'Anywhere. Each lead tells you where to buy and where to sell at what prices — Amazon, Walmart, eBay, or any other marketplace. You can list on Amazon and Walmart or wherever you sell, including in bulk.',
  },
  {
    q: 'What does a lead actually include?',
    a: 'Each lead shows the product, the vetted buy price and where to buy it, the verified sell price and where to list it, and the calculated margin in dollars and percent — plus the direct links your group uses to act in minutes.',
  },
  {
    q: 'How often are new leads published?',
    a: 'Leads are assigned as they are found and vetted — there is no fixed schedule, because real opportunities don’t follow one. Your dashboard always shows what’s currently actionable; expired leads are swept automatically.',
  },
  {
    q: 'Can a lead be shared with more than 5 people?',
    a: 'No. A lead belongs to exactly one group of 5, permanently. Its buy/sell details are never shown to anyone outside that group, which is exactly what keeps the margin from collapsing under competition.',
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
