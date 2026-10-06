-- profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_status text not null default 'none'
    check (subscription_status in ('none','trialing','active','past_due','canceled','incomplete','unpaid')),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- subscriptions (Stripe mirror)
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id_idx on public.subscriptions (user_id);
-- leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  buy_price numeric(12,2) not null check (buy_price > 0),
  sell_price numeric(12,2) not null check (sell_price > 0),
  margin numeric(12,2) generated always as (sell_price - buy_price) stored,
  margin_pct numeric(6,2) generated always as (
    case when buy_price > 0
      then (sell_price - buy_price) / buy_price * 100
      else 0 end
  ) stored,
  supplier_link text,
  listing_link text,
  notes text,
  status text not null default 'draft'
    check (status in ('draft','published','expired','retracted')),
  max_viewers int check (max_viewers is null or max_viewers > 0),
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_status_idx on public.leads (status);
create index leads_published_at_idx on public.leads (published_at desc);
-- lead_allocations (the exclusivity ledger)
create table public.lead_allocations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  allocated_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (lead_id, user_id)
);
create index lead_allocations_lead_id_idx on public.lead_allocations (lead_id);
create index lead_allocations_user_id_idx on public.lead_allocations (user_id);
create index lead_allocations_user_allocated_idx on public.lead_allocations (user_id, allocated_at desc);
-- platform_settings (global N)
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (key, value)
values ('default_lead_capacity', '5'::jsonb)
on conflict (key) do nothing;
-- stripe_events (webhook idempotency)
create table public.stripe_events (
  event_id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);
-- audit_log
create table public.audit_log (
  id bigint primary key generated always as identity,
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
