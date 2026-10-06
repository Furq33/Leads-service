'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type GroupOption = { id: string; name: string; member_count: number };

export default function LeadActions({
  leadId,
  leadStatus,
  assignedGroupName,
  groups,
}: {
  leadId: string;
  leadStatus: string;
  assignedGroupName: string | null;
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<'assign' | 'retract' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [groupId, setGroupId] = useState('');
  const [showAssign, setShowAssign] = useState(false);

  async function assign() {
    if (!groupId) {
      setError('Choose a group first.');
      return;
    }
    setError(null);
    setBusy('assign');
    try {
      const res = await fetch(`/api/v1/admin/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          (body as { error?: string } | null)?.error ??
            `Request failed (${res.status})`
        );
      }
      setShowAssign(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  async function retract() {
    const ok = window.confirm(
      'Retract this lead? It will be hidden from the group immediately.'
    );
    if (!ok) return;
    setError(null);
    setBusy('retract');
    try {
      const res = await fetch(`/api/v1/admin/leads/${leadId}/retract`, {
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
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {assignedGroupName && leadStatus === 'published' && (
        <p className="text-xs font-medium text-slate-600">
          Assigned to <span className="font-semibold">{assignedGroupName}</span>
        </p>
      )}
      <div className="flex gap-2">
        {leadStatus !== 'retracted' && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setShowAssign((s) => !s)}
            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {leadStatus === 'published' ? 'Reassign' : 'Assign & publish'}
          </button>
        )}
        {leadStatus === 'published' && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={retract}
            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {busy === 'retract' ? '…' : 'Retract'}
          </button>
        )}
      </div>
      {showAssign && (
        <div className="mt-1 w-56 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-semibold text-slate-700">
            Assign to group
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-900"
            >
              <option value="">Select a group…</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.member_count}/5)
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={busy !== null || !groupId}
            onClick={assign}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy === 'assign' ? 'Assigning…' : 'Confirm assign'}
          </button>
        </div>
      )}
      {error && <p className="max-w-[220px] text-xs text-red-600">{error}</p>}
    </div>
  );
}
