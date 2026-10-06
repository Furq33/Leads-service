export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PasswordForm from '@/components/PasswordForm';

export default async function AccountPage() {
  let email: string | null = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');
    email = user.email ?? null;
  } catch {
    redirect('/login');
  }
  if (!email) redirect('/login');

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Account
      </h1>
      <p className="mt-1 text-slate-600">Manage your sign-in and security.</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Email</h2>
        <p className="mt-1 text-sm text-slate-600">{email}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a new password for your account. You&apos;ll stay signed in
          on this device.
        </p>
        <div className="mt-4">
          <PasswordForm email={email} />
        </div>
      </div>
    </main>
  );
}
