create or replace function public.allocate_lead(p_lead_id uuid)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_existing int;
  v_slots int;
begin
  select coalesce(l.max_viewers, (s.value)::int)
    into v_capacity
  from public.leads l
  cross join public.platform_settings s
  where l.id = p_lead_id
    and s.key = 'default_lead_capacity'
  for update of l;
  if v_capacity is null then
    raise exception 'lead % not found or default_lead_capacity missing', p_lead_id;
  end if;
  select count(*) into v_existing
  from public.lead_allocations
  where lead_id = p_lead_id and status = 'active';
  v_slots := greatest(v_capacity - v_existing, 0);
  if v_slots > 0 then
    with candidates as (
      select p.id
      from public.profiles p
      where p.role = 'user'
        and p.subscription_status in ('active', 'trialing')
        and not exists (
          select 1 from public.lead_allocations a
          where a.lead_id = p_lead_id and a.user_id = p.id
        )
      order by
        (select max(a2.allocated_at)
           from public.lead_allocations a2
          where a2.user_id = p.id) nulls first,
        p.created_at asc
      limit v_slots
      for update of p skip locked
    )
    insert into public.lead_allocations (lead_id, user_id)
    select p_lead_id, id from candidates
    on conflict (lead_id, user_id) do update
      set status = 'active', revoked_at = null;
  end if;
  update public.leads
  set status = 'published',
      published_at = coalesce(published_at, now())
  where id = p_lead_id and status = 'draft';
  return query
    select a.user_id
    from public.lead_allocations a
    where a.lead_id = p_lead_id and a.status = 'active';
end;
$$;

create or replace function public.revoke_lead(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lead_allocations
  set status = 'revoked', revoked_at = now()
  where lead_id = p_lead_id and status = 'active';
  update public.leads
  set status = 'retracted'
  where id = p_lead_id and status = 'published';
end;
$$;

create or replace function public.expire_due_leads()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int := 0;
begin
  with due as (
    select id from public.leads
    where status = 'published' and expires_at is not null and expires_at <= now()
    for update skip locked
  ),
  rev as (
    update public.lead_allocations a
    set status = 'revoked', revoked_at = now()
    from due where a.lead_id = due.id and a.status = 'active'
    returning a.id
  ),
  exp as (
    update public.leads l
    set status = 'expired'
    from due where l.id = due.id
    returning l.id
  )
  select count(*) into v_count from exp;
  return v_count;
end;
$$;
