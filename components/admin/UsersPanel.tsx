'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  role: string;
  subscription_status: string;
  created_at: string;
  group: { id: string; name: string } | null;
};

export default function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/users');
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const body = (await res.json()) as { users?: User[] };
      setUsers(body.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setRole(id: string, role: 'admin' | 'user') {
    const target = users.find((u) => u.id === id);
    const label =
      role === 'admin'
        ? `Make ${target?.email ?? 'this user'} an admin? They will get full access to the admin panel.`
        : `Remove admin access from ${target?.email ?? 'this user'}?`;
    if (!window.confirm(label)) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  if (loading)
    return <p className="py-8 text-center text-sm text-slate-500">Loading users…</p>;
  if (error) return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  if (users.length === 0)
    return (
      <p className="py-8 text-center text-sm text-slate-500">No users yet.</p>
    );

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            {['Email', 'Role', 'Group', 'Subscription', 'Actions'].map((h) => (
              <th key={h} className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className="align-top">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{u.email}</div>
                {u.id === currentUserId && (
                  <div className="text-xs text-slate-500">(you)</div>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    u.role === 'admin'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {u.group?.name ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                {u.subscription_status}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {u.id === currentUserId ? (
                  <span className="text-xs text-slate-400">—</span>
                ) : u.role === 'admin' ? (
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() => setRole(u.id, 'user')}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busy === u.id ? '…' : 'Remove admin'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busy === u.id}
                    onClick={() => setRole(u.id, 'admin')}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {busy === u.id ? '…' : 'Make admin'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
