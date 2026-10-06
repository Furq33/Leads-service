alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.leads enable row level security;
alter table public.lead_allocations enable row level security;
alter table public.platform_settings enable row level security;
alter table public.stripe_events enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create policy "users_read_own_profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "users_read_own_subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id or public.is_admin());

create policy "admins_manage_leads"
  on public.leads for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "subscribers_read_allocated_leads"
  on public.leads for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
    and exists (
      select 1 from public.lead_allocations a
      where a.lead_id = leads.id
        and a.user_id = auth.uid()
        and a.status = 'active'
    )
  );

create policy "users_read_own_allocations"
  on public.lead_allocations for select
  using (auth.uid() = user_id or public.is_admin());

create policy "admins_read_settings"
  on public.platform_settings for select using (public.is_admin());
create policy "admins_write_settings"
  on public.platform_settings for all
  using (public.is_admin()) with check (public.is_admin());

create policy "admins_read_audit"
  on public.audit_log for select using (public.is_admin());
