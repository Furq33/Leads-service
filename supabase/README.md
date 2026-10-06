# Supabase — leads-service

Migrations live in `migrations/` and are numbered so they apply in order:

1. `2026100601_core.sql` — tables, indexes, constraints, `default_lead_capacity = 5`
2. `2026100602_rls.sql` — RLS enablement + policies (the privacy boundary)
3. `2026100603_functions.sql` — allocation engine (`allocate_lead`, `revoke_lead`, `expire_due_leads`)
4. `2026100604_auth_trigger.sql` — auto-create `profiles` row on signup (depends on `auth.users`)
5. `2026100605_seed.sql` — sample draft leads for local development (safe to delete)

## Apply

- With the Supabase CLI, after linking the project:
  ```sh
  supabase db push
  ```
- Or run the files in numeric order in the Supabase SQL editor.

## Dependencies

`2026100604_auth_trigger.sql` creates a trigger on `auth.users`. The `auth` schema
is present on all Supabase projects, so this migration applies cleanly there; it
will fail on a bare Postgres instance that has no `auth.users` table.
