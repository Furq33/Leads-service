import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// UX-level entitlement gate. Real enforcement is Postgres RLS; this middleware
// just routes users to login/billing before they hit gated pages/APIs.
const ENTITLED = new Set(['active', 'trialing']);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    {
      cookies: {
        // Modern @supabase/ssr cookie API (getAll/setAll); same UX-level
        // gate semantics as the deprecated get/set/remove form.
        getAll: () =>
          req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, role')
    .eq('id', user.id)
    .single();

  if (
    !profile ||
    (!ENTITLED.has(profile.subscription_status) && profile.role !== 'admin')
  ) {
    return NextResponse.redirect(new URL('/billing', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/v1/leads/:path*'],
};
