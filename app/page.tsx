import Link from 'next/link';
import SampleLeadCard from '@/components/SampleLeadCard';
import { SAMPLE_LEADS } from '@/lib/sample-leads';

const steps = [
  {
    n: '01',
    title: 'Subscribe',
    body: 'Join LeadVault for a flat $150/month. You are automatically placed in a private group of 5 members — no tiers, no upsells.',
  },
  {
    n: '02',
    title: 'We assign',
    body: 'Our team vets every lead — where to buy, where to sell, at what prices — and assigns it to your group. Only your 5 members ever see it.',
  },
  {
    n: '03',
    title: 'You sell',
    body: 'Buy from the source, then list on Amazon, Walmart, or wherever you sell — including in bulk — and pocket the margin.',
  },
];

const features = [
  'Private group of 5 — every lead is exclusive to your group',
  'Vetted buy price, sell price, and margin on every lead',
  'Exact sourcing guidance — buy from anywhere, sell anywhere',
  'Built for bulk: list on Amazon, Walmart, or your own channels',
  'Fresh leads assigned regularly, never recycled',
  'Cancel anytime from your billing page',
];

const faqs = [
  {
    q: 'How do you keep leads from getting saturated?',
    a: 'Every lead is assigned to exactly one group of 5 members. Nobody outside your group ever sees it — so you are never competing with hundreds of other sellers on the same product.',
  },
  {
    q: 'What marketplaces do the leads target?',
    a: 'Anywhere. Each lead tells you where to buy and where to sell at what prices — Amazon, Walmart, eBay, or any other marketplace. Many members sell in bulk.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes. Cancel anytime from your billing page and keep access until the end of your billing period. No contracts, no cancellation fees.',
  },
];

export default function Home() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <p className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Your private group of 5
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Exclusive product leads.{' '}
            <span className="text-indigo-600">Never saturated.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            LeadVault vets every e-commerce opportunity — where to buy, where
            to sell, at what prices — and hands each lead to one private group
            of 5 members. No lead farms, no competition stampedes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
            >
              Get exclusive leads
            </Link>
            <Link
              href="#how-it-works"
              className="w-full rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
            >
              How it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            $150/month · Cancel anytime
          </p>
        </div>
      </section>

      {/* Peek inside */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            Take a peek inside
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            This is the format every member sees — vetted numbers up front,
            exact links unlocked with membership.
          </p>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {SAMPLE_LEADS.slice(0, 2).map((lead) => (
              <SampleLeadCard key={lead.id} lead={lead} />
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Examples shown for illustration only.
          </p>
          <div className="mt-6 text-center">
            <Link
              href="/sample-leads"
              className="inline-block rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Explore more examples →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          How it works
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          Three steps from signup to your first margin.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="text-sm font-black tracking-widest text-indigo-600">
                {s.n}
              </div>
              <h3 className="mt-3 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-2xl bg-indigo-600 p-8 text-center text-white">
          <p className="text-lg font-semibold">The group-of-5 promise</p>
          <p className="mt-2 text-indigo-100">
            Every lead goes to exactly one group of five members — ever.
            Nobody outside your group sees it. That is what keeps every
            margin real.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            Simple pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
            One plan. Every lead. No tiers.
          </p>
          <div className="mx-auto mt-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            <h3 className="text-xl font-bold">LeadVault Pro</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-extrabold tracking-tight">
                $150
              </span>
              <span className="text-slate-500">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    ✓
                  </span>
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-8 block rounded-xl bg-indigo-600 px-6 py-3.5 text-center text-base font-semibold text-white transition hover:bg-indigo-700"
            >
              Start my subscription
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">
              Secure checkout · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-10 space-y-4">
          {faqs.map((f) => (
            <div
              key={f.q}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <h3 className="font-bold">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/login"
            className="inline-block rounded-xl bg-slate-900 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-slate-700"
          >
            Claim your seat — $150/month
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-black text-white">
              LV
            </span>
            <span className="font-bold text-slate-900">LeadVault</span>
          </div>
          <p className="text-sm text-slate-500">
            Exclusive e-commerce leads for serious resellers.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/sample-leads" className="hover:text-slate-900">
              Sample leads
            </Link>
            <Link href="/how-it-works" className="hover:text-slate-900">
              How it works
            </Link>
            <Link href="/faq" className="hover:text-slate-900">
              FAQ
            </Link>
            <Link href="/login" className="hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/billing" className="hover:text-slate-900">
              Billing
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
