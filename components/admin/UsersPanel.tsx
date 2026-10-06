'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  role: string;
  subscription_status: string;
  created_at: string;
  group: { id: string; name: string } | null;
};

type SortKey = 'email' | 'role' | 'group' | 'subscription_status' | 'created_at';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'group', label: 'Group' },
  { key: 'subscription_status', label: 'Subscription' },
  { key: 'created_at', label: 'Joined' },
];

function sortValue(u: User, key: SortKey): string {
  switch (key) {
    case 'group':
      return u.group?.name ?? '';
    case 'created_at':
      return u.created_at ?? '';
    default:
      return (u[key] as string) ?? '';
  }
}

export default function UsersPanel({ currentUserId }: { currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? users.filter((u) => u.email.toLowerCase().includes(q))
      : [...users];
    filtered.sort((a, b) => {
      const va = sortValue(a, sortKey).toLowerCase();
      const vb = sortValue(b, sortKey).toLowerCase();
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return filtered;
  }, [users, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  }

  async function deleteUser(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      setUsers((us) => us.filter((u) => u.id !== id));
      setConfirmDeleteId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="w-full max-w-xs rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
        />
        <span className="text-xs text-slate-500">
          {visible.length} of {users.length} users
        </span>
      </div>

      {users.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No users yet.</p>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No users match “{query}”.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="font-semibold text-slate-600 hover:text-slate-900"
                    >
                      {c.label}{' '}
                      <span className="text-indigo-600">
                        {sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-2.5 font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((u) => (
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
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {u.id === currentUserId ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {u.role === 'admin' ? (
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
                        {confirmDeleteId === u.id ? (
                          <>
                            <button
                              type="button"
                              disabled={busy === u.id}
                              onClick={() => deleteUser(u.id)}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                            >
                              {busy === u.id ? '…' : 'Confirm delete'}
                            </button>
                            <button
                              type="button"
                              disabled={busy === u.id}
                              onClick={() => setConfirmDeleteId(null)}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={busy === u.id}
                            onClick={() => setConfirmDeleteId(u.id)}
                            title={`Delete ${u.email}`}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
