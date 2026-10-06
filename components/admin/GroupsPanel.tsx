'use client';

import { useEffect, useState } from 'react';

type Member = {
  id: string | null;
  email: string | null;
  subscription_status: string | null;
  joined_at: string;
};

type Group = {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  members: Member[];
};

export default function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/admin/groups');
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const body = (await res.json()) as { groups?: Group[] };
        if (!cancelled) setGroups(body.groups ?? []);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load groups.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading)
    return <p className="py-8 text-center text-sm text-slate-500">Loading groups…</p>;
  if (error) return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  if (groups.length === 0)
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        No groups yet — the first one is created automatically when someone signs up.
      </p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => {
        const isOpen = !!open[g.id];
        const full = g.member_count >= 5;
        return (
          <div
            key={g.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{g.name}</h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  full
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {g.member_count}/5 {full ? 'full' : 'open'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [g.id]: !isOpen }))}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {isOpen ? 'Hide members' : `Show members (${g.member_count})`}
            </button>
            {isOpen && (
              <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                {g.members.length === 0 && (
                  <li className="text-xs text-slate-500">No members yet.</li>
                )}
                {g.members.map((m, i) => (
                  <li key={m.id ?? i} className="text-sm">
                    <div className="font-medium text-slate-800">
                      {m.email ?? 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {m.subscription_status ?? 'none'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
