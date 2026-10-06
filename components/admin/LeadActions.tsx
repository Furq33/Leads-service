'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LeadActions({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'publish' | 'retract' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(action: 'publish' | 'retract') {
    if (action === 'retract') {
      const ok = window.confirm(
        'Retract this lead? It will be hidden from subscribers immediately.'
      );
      if (!ok) return;
    }
    setError(null);
    setBusy(action);
    try {
      const res = await fetch(`/api/v1/admin/leads/${leadId}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => call('publish')}
          className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {busy === 'publish' ? '…' : 'Publish'}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => call('retract')}
          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        >
          {busy === 'retract' ? '…' : 'Retract'}
        </button>
      </div>
      {error && <p className="max-w-[180px] text-xs text-red-600">{error}</p>}
    </div>
  );
}
