-- 2026100606_groups.sql
-- Group model: every subscriber auto-joins a group of 5 at registration.
-- An admin assigns each lead to exactly one group; the 5 members of that
-- group see the buy/sell details. This replaces the rotation-based
-- allocation model (allocate_lead / lead_allocations are left dormant).

-- ---------------------------------------------------------------- groups

create table public.lead_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.lead_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id),
  unique (user_id) -- one group per user
);

create index group_members_group_id_idx on public.group_members (group_id);

-- A lead is assigned to at most one group (5 viewers max = exclusivity).
alter table public.leads
  add column if not exists assigned_group_id uuid
  references public.lead_groups (id) on delete set null;

create index if not exists leads_assigned_group_id_idx
  on public.leads (assigned_group_id);

-- ---------------------------------------------------------------- RLS

alter table public.lead_groups enable row level security;
alter table public.group_members enable row level security;

-- A member can see their own group; admins see all groups.
create policy "members_read_own_group"
  on public.lead_groups for select
  using (
    exists (
      select 1 from public.group_members m
      where m.group_id = lead_groups.id and m.user_id = auth.uid()
    )
    or public.is_admin()
  );

-- A member can see the members of their own group; admins see all.
create policy "members_read_own_group_members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members m2
      where m2.group_id = group_members.group_id and m2.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "admins_manage_groups"
  on public.lead_groups for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "admins_manage_group_members"
  on public.group_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- Members read leads assigned to their group (published, not expired).
drop policy if exists "subscribers_read_allocated_leads" on public.leads;

create policy "members_read_group_leads"
  on public.leads for select
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
    and assigned_group_id is not null
    and exists (
      select 1 from public.group_members m
      where m.group_id = leads.assigned_group_id
        and m.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------- auto-assign on registration

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_group_count int;
begin
  insert into public.profiles (id, email, role, subscription_status)
  values (new.id, new.email, 'user', 'none')
  on conflict (id) do nothing;

  -- Auto-assign the new user to the oldest group with fewer than 5 members;
  -- start a new group when every group is full.
  select g.id into v_group_id
  from public.lead_groups g
  left join public.group_members m on m.group_id = g.id
  group by g.id
  having count(m.user_id) < 5
  order by g.created_at asc
  limit 1;

  if v_group_id is null then
    select count(*) + 1 into v_group_count from public.lead_groups;
    insert into public.lead_groups (name)
    values ('Group ' || v_group_count)
    returning id into v_group_id;
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group_id, new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ---------------------------------------------------------------- backfill
-- Place any existing profiles (that have no group yet) into groups of 5,
-- oldest profile first.

do $$
declare
  r record;
  v_group_id uuid;
  v_group_count int;
begin
  for r in
    select p.id
    from public.profiles p
    left join public.group_members m on m.user_id = p.id
    where m.user_id is null
    order by p.created_at asc
  loop
    select g.id into v_group_id
    from public.lead_groups g
    left join public.group_members m on m.group_id = g.id
    group by g.id
    having count(m.user_id) < 5
    order by g.created_at asc
    limit 1;

    if v_group_id is null then
      select count(*) + 1 into v_group_count from public.lead_groups;
      insert into public.lead_groups (name)
      values ('Group ' || v_group_count)
      returning id into v_group_id;
    end if;

    insert into public.group_members (group_id, user_id)
    values (v_group_id, r.id)
    on conflict (user_id) do nothing;
  end loop;
end;
$$;
