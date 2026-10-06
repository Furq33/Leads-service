import Link from 'next/link';

export const metadata = {
  title: 'How It Works — LeadVault',
  description:
    'How LeadVault finds, vets, and exclusively allocates Amazon and Walmart arbitrage leads to at most 5 subscribers each.',
};

const steps = [
  {
    n: '01',
    title: 'We hunt',
    body: 'Our team scans Amazon, Walmart, and major retailers daily for pricing mismatches — clearance events, coupon stacks, regional price drops, and bundle deals with real resale value.',
  },
  {
    n: '02',
    title: 'We vet',
    body: 'Every candidate lead is verified by hand: is it actually in stock? Is the sell price real and recent? What do fees and shipping do to the margin? Only leads with a genuine, repeatable margin make the cut. Most candidates are rejected.',
  },
  {
    n: '03',
    title: 'You get your seat',
    body: 'Each published lead is allocated to at most 5 subscribers, first-come through a fair rotation. You see the buy price, sell price, margin, and the exact supplier and listing links — buy, list, and pocket the difference.',
  },
];

const promises = [
  {
    title: 'Max 5 subscribers per lead — ever',
    body: 'A lead is allocated to no more than five members. When the fifth seat fills, the lead is closed permanently. You will never compete with hundreds of sellers on the same product.',
  },
  {
    title: 'Fair rotation, not fastest finger',
    body: 'Leads are allocated with a fairness rotation: members who received leads least recently get priority on new ones. Everyone gets a fair shot at fresh opportunities.',
  },
  {
    title: 'Vetted margins, not guesses',
    body: 'Buy price, sell price, and margin are verified before a lead publishes. If the numbers don’t hold up under scrutiny, the lead never reaches your dashboard.',
  },
  {
    title: 'Fresh or nothing',
    body: 'Leads publish as they’re found and vetted — never recycled, never stale. Expired opportunities are swept automatically so your dashboard only shows what’s actionable.',
  },
];

export default function HowItWorksPage() {
  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-indigo-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-20">
          <p className="mb-4 inline-block rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            How it works
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            From price mismatch to your margin.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
            LeadVault turns retail pricing inefficiencies into exclusive,
            actionable arbitrage leads — shared with at most five people.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <div className="text-sm font-black tracking-widest text-indigo-600">
                {s.n}
              </div>
              <h2 className="mt-3 text-xl font-bold">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Promises */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-3xl font-extrabold tracking-tight">
            The rules that protect your margin
          </h2>
          <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
            {promises.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-bold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-extrabold tracking-tight">
          Ready to see your first lead?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Join LeadVault and get allocated exclusive arbitrage leads — max
          five subscribers per lead, cancel anytime.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sample-leads"
            className="w-full rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 sm:w-auto"
          >
            See example leads
          </Link>
          <Link
            href="/login"
            className="w-full rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:w-auto"
          >
            Join — $150/month
          </Link>
        </div>
      </section>
    </main>
  );
}
