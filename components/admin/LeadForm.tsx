'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type LeadInput = {
  id?: string;
  title: string;
  buy_price: string;
  sell_price: string;
  supplier_link: string;
  listing_link: string;
  notes: string;
  max_viewers: string;
  expires_at: string;
};

const emptyLead: LeadInput = {
  title: '',
  buy_price: '',
  sell_price: '',
  supplier_link: '',
  listing_link: '',
  notes: '',
  max_viewers: '',
  expires_at: '',
};

function toPayload(values: LeadInput) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  const str = (v: string) => (v.trim() === '' ? null : v.trim());
  const isoDateTime = (v: string) => {
    if (v.trim() === '') return null;
    const d = new Date(v); // datetime-local → local time → ISO with offset
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  };
  return {
    title: values.title.trim(),
    buy_price: num(values.buy_price),
    sell_price: num(values.sell_price),
    supplier_link: str(values.supplier_link),
    listing_link: str(values.listing_link),
    notes: str(values.notes),
    max_viewers:
      values.max_viewers.trim() === '' ? null : parseInt(values.max_viewers, 10),
    expires_at: isoDateTime(values.expires_at),
  };
}

export default function LeadForm({
  initial,
  onSaved,
}: {
  initial?: LeadInput | null;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<LeadInput>(initial ?? emptyLead);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isEdit = !!initial?.id;

  function set(field: keyof LeadInput, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const url = isEdit
        ? `/api/v1/admin/leads/${values.id}`
        : '/api/v1/admin/leads';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(values)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      if (!isEdit) setValues(emptyLead);
      onSaved?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
  const labelClass = 'mb-1 block text-xs font-semibold text-slate-600';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-base font-bold text-slate-900">
        {isEdit ? 'Edit lead' : 'Create lead'}
      </h3>

      <div>
        <label className={labelClass} htmlFor={isEdit ? 'edit-title' : 'title'}>
          Title
        </label>
        <input
          id={isEdit ? 'edit-title' : 'title'}
          required
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Product name / ASIN"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Buy price (USD)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={values.buy_price}
            onChange={(e) => set('buy_price', e.target.value)}
            placeholder="12.99"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Sell price (USD)</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={values.sell_price}
            onChange={(e) => set('sell_price', e.target.value)}
            placeholder="29.99"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Supplier link</label>
        <input
          type="url"
          value={values.supplier_link}
          onChange={(e) => set('supplier_link', e.target.value)}
          placeholder="https://supplier.example.com/…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Listing link</label>
        <input
          type="url"
          value={values.listing_link}
          onChange={(e) => set('listing_link', e.target.value)}
          placeholder="https://amazon.com/dp/…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Why this lead is worth acting on…"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Max viewers (blank = default)</label>
          <input
            type="number"
            min="1"
            step="1"
            value={values.max_viewers}
            onChange={(e) => set('max_viewers', e.target.value)}
            placeholder="5"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Expires at</label>
          <input
            type="datetime-local"
            value={values.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create lead'}
      </button>
    </form>
  );
}
