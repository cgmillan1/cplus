-- v11: trigger functions not callable via API, geo_dist search_path, RLS auth.uid() evaluated once per query,
-- indexes on foreign keys (from Supabase advisors). Applied 2026-11-25.
revoke execute on function public.expenses_approval() from public, anon, authenticated;
revoke execute on function public.time_entries_geo() from public, anon, authenticated;
alter function public.geo_dist(numeric, numeric, numeric, numeric) set search_path = '';
-- policies rewritten with (select auth.uid()): projects_read, push_own_*, time_entries.own_or_staff, team_msgs.read_msgs/send_msgs
create index if not exists checklist_items_checklist_idx on public.checklist_items (checklist_id);
create index if not exists expenses_approved_by_idx on public.expenses (approved_by);
create index if not exists invoices_payment_idx on public.invoices (payment_id);
create index if not exists leads_project_idx on public.leads (project_id);
create index if not exists projects_owner_idx on public.projects (owner);
create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists team_msgs_from_idx on public.team_msgs (from_user);
create index if not exists team_msgs_to_idx on public.team_msgs (to_user);
