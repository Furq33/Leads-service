'use client';

import { useState } from 'react';

export default function PortalButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/billing/portal', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) throw new Error('No portal URL returned.');
      window.location.href = body.url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
      >
        {busy ? 'Redirecting…' : 'Manage subscription'}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
