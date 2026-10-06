'use client';

import { useState } from 'react';

export default function CheckoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/billing/checkout', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      const body = (await res.json()) as { url?: string };
      if (!body.url) throw new Error('No checkout URL returned.');
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
        className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? 'Redirecting…' : 'Subscribe — $150/month'}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
