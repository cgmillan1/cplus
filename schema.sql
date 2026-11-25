-- =====================================================================
--  C Plus · base de datos (Supabase), con equipo y roles
--  admin:       todo, incluido el equipo y la configuración de la empresa
--  manager:     todos los proyectos, dinero, solicitudes, y asigna contratistas
--  contractor:  solo los proyectos asignados: pasos, materiales, avances y
--               mensajes. Nunca ve precios, pagos, presupuesto ni gastos.
--  Se puede volver a correr sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tablas ----------------------------------------------------

create table if not exists settings (
  owner uuid primary key references auth.users on delete cascade,
  company text default 'C Plus LLC',
  contact_name text default '',
  phone text default '',
  email text default '',
  legal_name text default '',
  license_no text default '',
  address text default '',
  warranty text default '',
  extra_terms text default '',
  share_pct numeric default 0 check (share_pct >= 0 and share_pct <= 100)
);

create table if not exists team (
  user_id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  email text not null default '',
  role text not null check (role in ('admin','manager','contractor')),
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  assigned_to uuid references team(user_id) on delete set null,
  client_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  client_name text default '',
  client_phone text default '',
  client_phone2 text default '',
  client_email text default '',
  title text default '',
  service text default '',
  details text default '',
  address text default '',
  start_date date,
  end_date date,
  status text default 'estimate_sent' check (status in ('estimate_sent','estimate_accepted','progress','done')),
  tax_rate numeric default 7.25,
  created_at timestamptz default now()
);
alter table projects add column if not exists assigned_to uuid references team(user_id) on delete set null;
create index if not exists projects_assigned_idx on projects (assigned_to);

create table if not exists items (            -- cotización (dinero)
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  kind text default 'mat' check (kind in ('mat','lab')),
  description text default '',
  qty numeric default 1,
  price numeric default 0,
  sort int default 0
);

create table if not exists materials (        -- trabajo (sin costos)
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  name text default '',
  qty numeric default 1,
  unit text default '',
  purchased boolean default false,
  purchased_on date,
  sort int default 0
);

create table if not exists steps (            -- trabajo
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text default '',
  done boolean default false,
  due_date date,
  sort int default 0
);

create table if not exists updates (          -- trabajo: avances con fotos
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  body text default '',
  photos text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists payments (         -- dinero
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  paid_on date default current_date,
  note text default '',
  amount numeric default 0
);

create table if not exists milestones (       -- dinero: calendario de pagos
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  label text default '',
  amount numeric default 0,
  sort int default 0
);

create table if not exists change_orders (    -- dinero
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text default '',
  details text default '',
  kind text default 'mat' check (kind in ('mat','lab')),
  amount numeric default 0,
  status text default 'pending' check (status in ('draft','pending','approved','declined')),
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists budget (           -- dinero
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  category text default '',
  amount numeric default 0,
  sort int default 0
);

create table if not exists expenses (         -- dinero
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  spent_on date default current_date,
  description text default '',
  category text default '',
  budget_id uuid references budget on delete set null,
  vendor text default '',
  amount numeric default 0,
  receipt text
);

create table if not exists comments (         -- trabajo: mensajes con el cliente
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  author text not null check (author in ('client','contractor')),
  name text default '',
  body text not null,
  seen boolean default false,
  created_at timestamptz default now()
);

create table if not exists documents (        -- dinero: cotización, contrato, terminación
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  kind text not null check (kind in ('estimate','contract','completion')),
  lang text default 'es' check (lang in ('es','en')),
  snapshot jsonb not null,
  total numeric default 0,
  status text default 'draft' check (status in ('draft','sent','signed','void')),
  signed_by text,
  signed_on date,
  file text,
  created_at timestamptz default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  name text not null,
  phone text default '',
  email text default '',
  city text default '',
  service text default '',
  message text default '',
  lang text default 'es',
  status text default 'new' check (status in ('new','contacted','won','archived')),
  project_id uuid references projects on delete set null,
  created_at timestamptz default now(),
  constraint leads_len check (char_length(name) between 1 and 120 and char_length(coalesce(phone,'')) <= 40
    and char_length(coalesce(email,'')) <= 160 and char_length(coalesce(city,'')) <= 120
    and char_length(coalesce(service,'')) <= 80 and char_length(coalesce(message,'')) <= 2000)
);
create index if not exists leads_owner_idx on leads (owner, created_at desc);

-- código de un solo uso para crear la cuenta del admin (nadie lo puede leer por la API)
create table if not exists setup_code (code text primary key, created_at timestamptz default now());
alter table setup_code enable row level security;
revoke all on setup_code from anon, authenticated;

-- ---------- Quién es quién --------------------------------------------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from team where user_id = auth.uid() and active;
$$;
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(my_role() in ('admin','manager'), false);
$$;
create or replace function public.can_work(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() or (my_role() = 'contractor' and exists
    (select 1 from projects p where p.id = pid and p.assigned_to = auth.uid()));
$$;
create or replace function public.company_owner() returns uuid
language sql stable security definer set search_path = public as $$
  select owner from settings order by owner limit 1;
$$;
revoke all on function public.my_role(), public.is_staff(), public.can_work(uuid), public.company_owner() from public;
grant execute on function public.my_role(), public.is_staff(), public.can_work(uuid) to authenticated;

-- todo proyecto pertenece a la empresa, aunque lo cree el project manager
create or replace function public.projects_set_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.owner := coalesce(company_owner(), auth.uid());
  if new.status is null or new.status = 'planning' then new.status := 'estimate_sent';
  elsif new.status = 'paused' then new.status := 'progress'; end if;
  if new.assigned_to is not null and not exists
     (select 1 from team where user_id = new.assigned_to and role = 'contractor') then
    raise exception 'assigned user is not a contractor';
  end if;
  return new;
end $$;
drop trigger if exists projects_owner on projects;
create trigger projects_owner before insert or update of owner, status, assigned_to on projects
  for each row execute function public.projects_set_owner();

-- ---------- Seguridad ---------------------------------------------------

alter table settings enable row level security;
alter table team enable row level security;
alter table projects enable row level security;
alter table leads enable row level security;

drop policy if exists own_settings on settings;
drop policy if exists settings_read on settings;
drop policy if exists settings_admin on settings;
create policy settings_read on settings for select to authenticated using (my_role() is not null);
create policy settings_admin on settings for update to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

drop policy if exists team_read on team;
drop policy if exists team_admin on team;
create policy team_read on team for select to authenticated using (my_role() is not null);
create policy team_admin on team for update to authenticated
  using (my_role() = 'admin') with check (my_role() = 'admin');

drop policy if exists own_projects on projects;
drop policy if exists projects_read on projects;
drop policy if exists projects_staff_ins on projects;
drop policy if exists projects_staff_upd on projects;
drop policy if exists projects_staff_del on projects;
create policy projects_read on projects for select to authenticated
  using (is_staff() or (my_role() = 'contractor' and assigned_to = auth.uid()));
create policy projects_staff_ins on projects for insert to authenticated with check (is_staff());
create policy projects_staff_upd on projects for update to authenticated using (is_staff()) with check (is_staff());
create policy projects_staff_del on projects for delete to authenticated using (is_staff());

drop policy if exists own_leads on leads;
drop policy if exists leads_staff on leads;
create policy leads_staff on leads for all to authenticated using (is_staff()) with check (is_staff());

do $$
declare t text;
begin
  -- trabajo: staff y el contratista asignado
  foreach t in array array['materials','steps','updates','comments'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own_rows on %I', t);
    execute format('drop policy if exists work_rows on %I', t);
    execute format('create policy work_rows on %I for all to authenticated using (can_work(project_id)) with check (can_work(project_id))', t);
    execute format('create index if not exists %I on %I (project_id)', t || '_project_idx', t);
  end loop;
  -- dinero: solo admin y project manager
  foreach t in array array['items','payments','milestones','change_orders','budget','expenses','documents'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own_rows on %I', t);
    execute format('drop policy if exists money_rows on %I', t);
    execute format('create policy money_rows on %I for all to authenticated using (is_staff()) with check (is_staff())', t);
    execute format('create index if not exists %I on %I (project_id)', t || '_project_idx', t);
  end loop;
end $$;

-- ---------- Acceso del cliente con su enlace privado ------------------

create or replace function client_project(tok text)
returns json language plpgsql security definer set search_path = public as $$
declare p projects; r json;
begin
  select * into p from projects where client_token = tok;
  if p.id is null then return null; end if;
  select json_build_object(
    'project', json_build_object('id', p.id, 'client_name', p.client_name, 'title', p.title, 'details', p.details, 'service', p.service,
       'address', p.address, 'start_date', p.start_date, 'end_date', p.end_date,
       'status', p.status, 'tax_rate', p.tax_rate),
    'contact', (select json_build_object('company', s.company, 'name', s.contact_name, 'phone', s.phone, 'email', s.email,
                'legal_name', s.legal_name, 'license_no', s.license_no, 'address', s.address)
                from settings s where s.owner = p.owner),
    'items', coalesce((select json_agg(i order by i.sort, i.description) from (select id, kind, description, qty, price, sort from items where project_id = p.id) i), '[]'),
    'materials', coalesce((select json_agg(m order by m.sort, m.name) from (select id, name, qty, unit, purchased, purchased_on, sort from materials where project_id = p.id) m), '[]'),
    'steps', coalesce((select json_agg(s order by s.sort, s.due_date) from (select id, title, done, due_date, sort from steps where project_id = p.id) s), '[]'),
    'updates', coalesce((select json_agg(u order by u.created_at desc) from (select id, body, photos, created_at from updates where project_id = p.id) u), '[]'),
    'payments', coalesce((select json_agg(x order by x.paid_on) from (select id, paid_on, note, amount from payments where project_id = p.id) x), '[]'),
    'milestones', coalesce((select json_agg(x order by x.sort) from (select id, label, amount, sort from milestones where project_id = p.id) x), '[]'),
    'change_orders', coalesce((select json_agg(x order by x.created_at desc) from (select id, title, details, kind, amount, status, decided_by, decided_at, created_at from change_orders where project_id = p.id and status <> 'draft') x), '[]'),
    'comments', coalesce((select json_agg(x order by x.created_at) from (select id, author, name, body, created_at from comments where project_id = p.id) x), '[]'),
    'documents', coalesce((select json_agg(x order by x.created_at desc) from (select id, kind, lang, snapshot, total, status, signed_by, signed_on, file, created_at from documents where project_id = p.id and status in ('sent','signed')) x), '[]')
  ) into r;
  return r;
end $$;

create or replace function client_comment(tok text, who text, msg text)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select id into pid from projects where client_token = tok;
  if pid is null or coalesce(trim(msg), '') = '' then raise exception 'invalid'; end if;
  if (select count(*) from comments where project_id = pid and author = 'client'
      and created_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too many messages';
  end if;
  insert into comments (project_id, author, name, body)
  values (pid, 'client', left(coalesce(who, ''), 80), left(msg, 2000));
end $$;

create or replace function client_decide(tok text, co uuid, approve boolean, who text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update change_orders c set status = case when approve then 'approved' else 'declined' end,
         decided_by = left(coalesce(who, ''), 80), decided_at = now()
  from projects p
  where c.id = co and c.project_id = p.id and p.client_token = tok and c.status = 'pending';
  if not found then raise exception 'invalid'; end if;
end $$;

create or replace function submit_lead(who text, tel text, mail text, town text, svc text, msg text, lng text)
returns void language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  o := company_owner();
  if o is null then raise exception 'not configured'; end if;
  if coalesce(trim(who), '') = '' or (coalesce(trim(tel), '') = '' and coalesce(trim(mail), '') = '') then
    raise exception 'invalid';
  end if;
  if (select count(*) from leads where created_at > now() - interval '1 hour') >= 30 then
    raise exception 'too many requests';
  end if;
  insert into leads (owner, name, phone, email, city, service, message, lang)
  values (o, left(trim(who), 120), left(coalesce(tel, ''), 40), left(coalesce(mail, ''), 160),
          left(coalesce(town, ''), 120), left(coalesce(svc, ''), 80), left(coalesce(msg, ''), 2000),
          case when lng = 'en' then 'en' else 'es' end);
end $$;

revoke all on function client_project(text), client_comment(text, text, text), client_decide(text, uuid, boolean, text),
  submit_lead(text, text, text, text, text, text, text) from public;
grant execute on function client_project(text), client_comment(text, text, text), client_decide(text, uuid, boolean, text),
  submit_lead(text, text, text, text, text, text, text) to anon, authenticated;

-- ---------- Reglas de datos -------------------------------------------

create or replace function expenses_budget_same_project() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.budget_id is not null and not exists
     (select 1 from budget b where b.id = new.budget_id and b.project_id = new.project_id) then
    raise exception 'budget category belongs to another project';
  end if;
  return new;
end $$;
drop trigger if exists expenses_budget_check on expenses;
create trigger expenses_budget_check before insert or update of budget_id, project_id on expenses
  for each row execute function expenses_budget_same_project();
create index if not exists expenses_budget_idx on expenses (budget_id);

do $$
declare c record;
begin
  for c in select * from (values
    ('projects', 'projects_token_len',   'char_length(client_token) >= 24'),
    ('projects', 'projects_tax_range',   'tax_rate >= 0 and tax_rate <= 25'),
    ('projects', 'projects_text_len',    'char_length(coalesce(title,'''')) <= 200 and char_length(coalesce(client_name,'''')) <= 200 and char_length(coalesce(address,'''')) <= 300'),
    ('items', 'items_nonneg',            'qty >= 0 and price >= 0'),
    ('items', 'items_text_len',          'char_length(coalesce(description,'''')) <= 500'),
    ('materials', 'materials_nonneg',    'qty >= 0'),
    ('payments', 'payments_positive',    'amount > 0'),
    ('milestones', 'milestones_nonneg',  'amount >= 0'),
    ('budget', 'budget_nonneg',          'amount >= 0'),
    ('expenses', 'expenses_nonneg',      'amount >= 0'),
    ('change_orders', 'co_text_len',     'char_length(coalesce(details,'''')) <= 2000'),
    ('updates', 'updates_text_len',      'char_length(coalesce(body,'''')) <= 4000 and coalesce(array_length(photos, 1), 0) <= 30'),
    ('comments', 'comments_text_len',    'char_length(body) between 1 and 2000')
  ) as v(tbl, name, expr) loop
    if not exists (select 1 from pg_constraint where conname = c.name) then
      execute format('alter table %I add constraint %I check (%s) not valid', c.tbl, c.name, c.expr);
    end if;
  end loop;
end $$;

-- ---------- Fotos, recibos y documentos -------------------------------
-- Cada archivo va en la carpeta del proyecto: <proyecto>/<archivo>.
-- photos: staff y el contratista asignado. receipts y docs: solo staff.

create or replace function public.work_folder(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects p where p.id::text = split_part(path, '/', 1)
                 and (is_staff() or (my_role() = 'contractor' and p.assigned_to = auth.uid())));
$$;
create or replace function public.staff_folder(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() and exists (select 1 from projects p where p.id::text = split_part(path, '/', 1));
$$;
revoke all on function public.work_folder(text), public.staff_folder(text) from public;
grant execute on function public.work_folder(text), public.staff_folder(text) to authenticated;

insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('docs', 'docs', true) on conflict (id) do nothing;

drop policy if exists cplus_photos_write on storage.objects;
drop policy if exists cplus_photos_delete on storage.objects;
drop policy if exists cplus_photos_list on storage.objects;
drop policy if exists cplus_receipts_all on storage.objects;
drop policy if exists cplus_docs_all on storage.objects;
create policy cplus_photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.work_folder(name));
create policy cplus_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.work_folder(name));
create policy cplus_photos_list on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.work_folder(name));
create policy cplus_receipts_all on storage.objects for all to authenticated
  using (bucket_id = 'receipts' and public.staff_folder(name))
  with check (bucket_id = 'receipts' and public.staff_folder(name));
create policy cplus_docs_all on storage.objects for all to authenticated
  using (bucket_id = 'docs' and public.staff_folder(name))
  with check (bucket_id = 'docs' and public.staff_folder(name));

-- ---------- Permisos de la API ----------------------------------------
grant usage on schema public to anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['settings','team','projects','items','materials','steps','updates','payments','milestones','change_orders','budget','expenses','comments','leads','documents'] loop
    execute format('grant select, insert, update, delete on %I to authenticated', t);
    execute format('revoke all on %I from anon', t);
  end loop;
end $$;
revoke insert, delete on team from authenticated;      -- el equipo se crea y se borra solo desde la función "team"
revoke insert, delete on settings from authenticated;

-- funciones internas: nadie las llama directo desde la API
revoke execute on function public.my_role(), public.is_staff(), public.can_work(uuid), public.work_folder(text), public.staff_folder(text) from anon;
revoke execute on function public.company_owner(), public.projects_set_owner() from anon, authenticated, public;
revoke execute on function public.expenses_budget_same_project() from anon, authenticated, public;

-- código de configuración para crear el primer admin (se borra al usarlo)
insert into setup_code (code) select upper(encode(extensions.gen_random_bytes(4), 'hex'))
  where not exists (select 1 from team) and not exists (select 1 from setup_code);

-- ---------- versión 4: fotos en la cotización y aviso por correo ----------
-- (ya aplicado en Supabase: ver la migración "lead_photos_and_alerts")
-- ---------- versión 5: proyectos recibidos, obra y taxes ----------
-- ver supabase/v5_field_and_taxes.sql (aplicado como "v5_field_and_taxes")
