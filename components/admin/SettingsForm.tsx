'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({
  currentCapacity,
}: {
  currentCapacity: number | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(
    currentCapacity === null ? '' : String(currentCapacity)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (!Number.isInteger(n) || n < 1) {
      setError('Enter a whole number of 1 or more.');
      return;
    }
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const res = await fetch('/api/v1/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_lead_capacity: n }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h3 className="text-base font-bold text-slate-900">Settings</h3>
      <p className="mt-1 text-sm text-slate-600">
        Default number of subscribers each newly published lead is allocated
        to (the exclusivity cap).
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2">
        <div className="flex-1">
          <label
            htmlFor="capacity"
            className="mb-1 block text-xs font-semibold text-slate-600"
          >
            Current: {currentCapacity ?? '—'}
          </label>
          <input
            id="capacity"
            type="number"
            min={1}
            step={1}
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Default lead capacity updated.
        </p>
      )}
    </div>
  );
}
