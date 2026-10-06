import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SignOutButton from './SignOutButton';

export default async function Header() {
  let signedIn = false;
  let isAdmin = false;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = !!user;
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = (profile as { role?: string } | null)?.role === 'admin';
    }
  } catch {
    signedIn = false;
    isAdmin = false;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-black text-white">
            LV
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            LeadVault
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {signedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
              <Link
                href="/billing"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Billing
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Admin
                </Link>
              )}
              <span className="ml-1">
                <SignOutButton />
              </span>
            </>
          ) : (
            <>
              <Link
                href="/sample-leads"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
              >
                Sample leads
              </Link>
              <Link
                href="/how-it-works"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
              >
                How it works
              </Link>
              <Link
                href="/faq"
                className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-block"
              >
                FAQ
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
