'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={busy}
      className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
