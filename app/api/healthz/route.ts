import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';

function isConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!url && url !== PLACEHOLDER_URL && !!anon && anon !== 'placeholder-anon-key';
}

/**
 * Liveness endpoint for Railway / uptime checks.
 * Never throws at build or runtime: catches all errors and never requires
 * real secrets to be present.
 */
export async function GET() {
  let supabase: 'reachable' | 'unreachable' | 'not-configured' = 'not-configured';

  if (isConfigured()) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      // Lightweight ping: HEAD against the Auth settings endpoint.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${url}/auth/v1/settings`, {
        method: 'HEAD',
        headers: { apikey: anon },
        signal: controller.signal,
      });
      clearTimeout(timer);
      supabase = res.ok || res.status < 500 ? 'reachable' : 'unreachable';
    } catch {
      supabase = 'unreachable';
    }
  }

  return NextResponse.json({ ok: true, supabase });
}
