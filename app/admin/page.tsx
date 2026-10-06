export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatUSD, formatPct, formatDate, marginPct } from '@/lib/format';
import LeadForm, { type LeadInput } from '@/components/admin/LeadForm';
import LeadActions from '@/components/admin/LeadActions';
import AllocationViewer from '@/components/admin/AllocationViewer';
import SettingsForm from '@/components/admin/SettingsForm';

type Lead = {
  id: string;
  title: string;
  buy_price: number;
  sell_price: number;
  supplier_link: string | null;
  listing_link: string | null;
  notes: string | null;
  max_viewers: number | null;
  status: string;
  published_at: string | null;
  expires_at: string | null;
};

const STATUSES = ['all', 'draft', 'published', 'retracted'];

function statusBadge(status: string) {
  const base =
    'inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize';
  if (status === 'published') return `${base} bg-emerald-100 text-emerald-800`;
  if (status === 'retracted') return `${base} bg-red-100 text-red-800`;
  return `${base} bg-slate-100 text-slate-700`;
}

function leadToInput(lead: Lead): LeadInput {
  const dt = (iso: string | null) =>
    iso
      ? new Date(iso).toISOString().slice(0, 16)
      : '';
  return {
    id: lead.id,
    title: lead.title ?? '',
    buy_price: lead.buy_price != null ? String(lead.buy_price) : '',
    sell_price: lead.sell_price != null ? String(lead.sell_price) : '',
    supplier_link: lead.supplier_link ?? '',
    listing_link: lead.listing_link ?? '',
    notes: lead.notes ?? '',
    max_viewers: lead.max_viewers != null ? String(lead.max_viewers) : '',
    expires_at: dt(lead.expires_at),
  };
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  // Defense in depth: the API routes are the real gate; the UI double-checks.
  let isAdmin = false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = (profile as { role?: string } | null)?.role === 'admin';
    }
  } catch {
    isAdmin = false;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Access denied</h1>
        <p className="mt-2 text-slate-600">
          This area is restricted to LeadVault administrators.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to dashboard
        </Link>
      </main>
    );
  }

  const statusFilter = STATUSES.includes(searchParams.status ?? '')
    ? (searchParams.status as string)
    : 'all';

  let leads: Lead[] = [];
  let statusCounts: Record<string, number> = {};
  let allocationCount = 0;
  let subscriptionCounts: Record<string, number> = {};
  let defaultCapacity: number | null = null;

  try {
    const supabase = createClient();

    try {
      const { data } = await supabase.from('leads').select('status');
      if (data) {
        statusCounts = (data as { status: string }[]).reduce(
          (acc, l) => {
            const s = l.status || 'unknown';
            acc[s] = (acc[s] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    } catch {
      statusCounts = {};
    }

    try {
      const { count } = await supabase
        .from('allocations')
        .select('id', { count: 'exact', head: true });
      allocationCount = count ?? 0;
    } catch {
      allocationCount = 0;
    }

    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_status');
      if (data) {
        subscriptionCounts = (data as { subscription_status: string }[]).reduce(
          (acc, p) => {
            const s = p.subscription_status || 'unknown';
            acc[s] = (acc[s] ?? 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    } catch {
      subscriptionCounts = {};
    }

    let query = supabase
      .from('leads')
      .select(
        'id, title, buy_price, sell_price, supplier_link, listing_link, notes, max_viewers, status, published_at, expires_at'
      )
      .order('published_at', { ascending: false, nullsFirst: true });
    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    const { data, error } = await query;
    if (!error && data) leads = data as unknown as Lead[];

    try {
      const { data: settings } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'default_lead_capacity')
        .single();
      const v = (settings as { value?: unknown } | null)?.value;
      defaultCapacity =
        typeof v === 'number' ? v : v != null ? parseInt(String(v), 10) : NaN;
      if (!Number.isInteger(defaultCapacity)) defaultCapacity = null;
    } catch {
      defaultCapacity = null;
    }
    if (defaultCapacity === null) {
      const env = process.env.DEFAULT_LEAD_CAPACITY;
      defaultCapacity = env ? parseInt(env, 10) : 5;
      if (!Number.isInteger(defaultCapacity)) defaultCapacity = 5;
    }
  } catch {
    leads = [];
  }

  const metrics: { label: string; value: number | string }[] = [
    { label: 'Total leads', value: leads.length || Object.values(statusCounts).reduce((a, b) => a + b, 0) },
    { label: 'Draft', value: statusCounts['draft'] ?? 0 },
    { label: 'Published', value: statusCounts['published'] ?? 0 },
    { label: 'Retracted', value: statusCounts['retracted'] ?? 0 },
    { label: 'Active allocations', value: allocationCount },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Admin
      </h1>
      <p className="mt-1 text-slate-600">
        Manage leads, allocations, and platform settings.
      </p>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
          >
            <div className="text-2xl font-extrabold text-slate-900">
              {m.value}
            </div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Subscribers by status */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900">
          Subscribers by subscription status
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(subscriptionCounts).length === 0 ? (
            <span className="text-sm text-slate-500">No data</span>
          ) : (
            Object.entries(subscriptionCounts).map(([s, c]) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {s}: {c}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Leads table */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">Leads</h2>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {STATUSES.map((s) => (
                <Link
                  key={s}
                  href={s === 'all' ? '/admin' : `/admin?status=${s}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    statusFilter === s
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            {leads.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-slate-500">
                No leads found
                {statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}.
              </p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    {['Title', 'Buy', 'Sell', 'Margin %', 'Status', 'Published', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-600"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="align-top">
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {lead.title}
                        </div>
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                            Edit
                          </summary>
                          <div className="mt-2 w-72 rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <LeadForm initial={leadToInput(lead)} />
                          </div>
                        </details>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatUSD(lead.buy_price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {formatUSD(lead.sell_price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-emerald-700">
                        {formatPct(marginPct(lead.buy_price, lead.sell_price))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={statusBadge(lead.status)}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(lead.published_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <LeadActions leadId={lead.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <LeadForm />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <AllocationViewer />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SettingsForm currentCapacity={defaultCapacity} />
          </div>
        </div>
      </div>
    </main>
  );
}
