'use client';

import { useState } from 'react';

type Allocation = {
  email: string;
  allocated_at: string | null;
};

export default function AllocationViewer({
  defaultLeadId,
}: {
  defaultLeadId?: string;
}) {
  const [leadId, setLeadId] = useState(defaultLeadId ?? '');
  const [rows, setRows] = useState<Allocation[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAllocations(e?: React.FormEvent) {
    e?.preventDefault();
    if (!leadId.trim()) {
      setError('Enter a lead ID to look up its allocations.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/allocations?lead_id=${encodeURIComponent(leadId.trim())}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      const body = await res.json();
      const list = Array.isArray(body)
        ? body
        : ((body as { allocations?: unknown }).allocations ?? []);
      setRows(
        (list as unknown[]).map((r) => {
          const row = r as Record<string, unknown>;
          return {
            email: String(row.email ?? '—'),
            allocated_at:
              typeof row.allocated_at === 'string' ? row.allocated_at : null,
          };
        })
      );
    } catch (err) {
      setRows(null);
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-bold text-slate-900">Allocations</h3>
      <p className="mt-1 text-sm text-slate-600">
        Look up which subscribers a lead was allocated to.
      </p>

      <form onSubmit={fetchAllocations} className="mt-4 flex gap-2">
        <input
          value={leadId}
          onChange={(e) => setLeadId(e.target.value)}
          placeholder="Lead ID (UUID)"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Loading…' : 'Lookup'}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {rows !== null && !error && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No allocations found for this lead.
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">
                    Subscriber email
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-slate-600">
                    Allocated at
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r, i) => (
                  <tr key={`${r.email}-${i}`}>
                    <td className="px-4 py-2.5 text-slate-900">{r.email}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {r.allocated_at
                        ? new Date(r.allocated_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
