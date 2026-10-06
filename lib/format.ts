/** Formatting helpers shared by LeadVault UI. */

export function formatUSD(n: number | null | undefined): string {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatPct(n: number | null | undefined): string {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return `${v.toFixed(1)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Margin as a percentage of buy price; guards against zero/negative buy prices. */
export function marginPct(buyPrice: number, sellPrice: number): number {
  if (!buyPrice || buyPrice <= 0) return 0;
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}
