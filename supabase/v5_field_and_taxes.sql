-- =====================================================================
--  C Plus · versión 5
--  1. Proyectos recibidos de otras empresas: budget recibido, revisión y aprobación
--  2. Herramientas de obra (como CompanyCam): fotos con etiquetas y ubicación,
--     checklists con foto obligatoria, plantillas, tareas, bitácora diaria y equipo
--  3. Gastos listos para taxes: categoría fiscal, método de pago, impuesto,
--     gastos generales de la empresa (sin proyecto) y datos leídos de la factura
--  Se puede volver a correr sin perder datos.
-- =====================================================================

-- ---------- 1. proyectos recibidos ----------
alter table projects add column if not exists source_company text default '';
alter table projects add column if not exists source_ref text default '';
alter table projects add column if not exists contract_amount numeric default 0;
alter table projects add column if not exists review_status text default 'approved';
alter table projects add column if not exists review_note text default '';
alter table projects add column if not exists reviewed_by text;
alter table projects add column if not exists reviewed_at timestamptz;
alter table projects add column if not exists received_on date;
alter table projects add column if not exists budget_file text;
alter table projects add column if not exists crew uuid[] default '{}';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'projects_review_chk') then
    alter table projects add constraint projects_review_chk check (review_status in ('review','approved','rejected'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_contract_nonneg') then
    alter table projects add constraint projects_contract_nonneg check (contract_amount >= 0);
  end if;
end $$;

-- el contratista ve un proyecto si es el asignado o está en el equipo (crew), y ya fue aprobado
create or replace function public.can_work(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() or (my_role() = 'contractor' and exists
    (select 1 from projects p where p.id = pid and p.review_status = 'approved'
       and (p.assigned_to = auth.uid() or auth.uid() = any(coalesce(p.crew, '{}')))));
$$;
drop policy if exists projects_read on projects;
create policy projects_read on projects for select to authenticated
  using (is_staff() or (my_role() = 'contractor' and review_status = 'approved'
         and (assigned_to = auth.uid() or auth.uid() = any(coalesce(crew, '{}')))));

create or replace function public.work_folder(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects p where p.id::text = split_part(path, '/', 1) and can_work(p.id));
$$;
-- recibos: carpeta del proyecto o "general" para gastos de la empresa
create or replace function public.staff_folder(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select is_staff() and (split_part(path, '/', 1) = 'general'
    or exists (select 1 from projects p where p.id::text = split_part(path, '/', 1)));
$$;

-- el equipo extra también tiene que ser del equipo de C Plus
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
  if exists (select 1 from unnest(coalesce(new.crew, '{}')) u where not exists (select 1 from team where user_id = u)) then
    raise exception 'crew member is not on the team';
  end if;
  return new;
end $$;
drop trigger if exists projects_owner on projects;
create trigger projects_owner before insert or update of owner, status, assigned_to, crew on projects
  for each row execute function public.projects_set_owner();

-- ---------- 3. gastos para taxes ----------
alter table expenses alter column project_id drop not null;
alter table expenses add column if not exists tax_cat text default 'materials';
alter table expenses add column if not exists pay_method text default '';
alter table expenses add column if not exists sales_tax numeric default 0;
alter table expenses add column if not exists notes text default '';
alter table expenses add column if not exists scanned jsonb;
alter table expenses add column if not exists created_by uuid default auth.uid();
alter table expenses add column if not exists created_at timestamptz default now();
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'expenses_taxcat_chk') then
    alter table expenses add constraint expenses_taxcat_chk check (tax_cat in
      ('materials','subcontract','wages','equipment','tools','vehicle','permits','disposal','insurance','meals','office','advertising','other'));
  end if;
end $$;
create index if not exists expenses_spent_idx on expenses (spent_on);
-- gastos viejos: los de mano de obra y subcontratos quedan en su categoría fiscal
update expenses e set tax_cat = case
  when b.category ilike '%subcontrat%' then 'subcontract'
  when b.category ilike '%mano de obra%' or b.category ilike '%labor%' then 'wages'
  when b.category ilike '%permis%' or b.category ilike '%basura%' then 'permits'
  else 'materials' end
from budget b where b.id = e.budget_id and e.scanned is null and e.tax_cat = 'materials';

-- ---------- 2. herramientas de obra ----------
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  path text not null,
  caption text default '',
  tags text[] default '{}',
  kind text default 'progress' check (kind in ('before','progress','after','issue')),
  shared boolean default true,
  lat numeric, lng numeric,
  by_user uuid default auth.uid(),
  by_name text default '',
  taken_at timestamptz default now(),
  created_at timestamptz default now(),
  constraint photos_len check (char_length(coalesce(caption,'')) <= 1000 and coalesce(array_length(tags,1),0) <= 20)
);
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text default '',
  sort int default 0,
  created_at timestamptz default now()
);
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  checklist_id uuid not null references checklists on delete cascade,
  body text default '',
  needs_photo boolean default false,
  done boolean default false,
  photo text,
  done_by text,
  done_at timestamptz,
  sort int default 0
);
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  title text default '',
  assigned_to uuid references team(user_id) on delete set null,
  due_date date,
  done boolean default false,
  done_at timestamptz,
  created_at timestamptz default now()
);
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  log_date date default current_date,
  weather text default '',
  crew text default '',
  hours numeric default 0,
  work_done text default '',
  next_steps text default '',
  issues text default '',
  photos text[] default '{}',
  by_name text default '',
  created_at timestamptz default now(),
  constraint logs_len check (char_length(coalesce(work_done,'')) <= 4000 and char_length(coalesce(issues,'')) <= 4000
    and char_length(coalesce(next_steps,'')) <= 4000 and coalesce(array_length(photos,1),0) <= 30)
);
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  kind text default 'checklist' check (kind in ('checklist')),
  name text not null,
  items jsonb not null default '[]',
  created_at timestamptz default now()
);

do $$
declare t text;
begin
  foreach t in array array['photos','checklists','checklist_items','tasks','daily_logs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists work_rows on %I', t);
    execute format('create policy work_rows on %I for all to authenticated using (can_work(project_id)) with check (can_work(project_id))', t);
    execute format('create index if not exists %I on %I (project_id)', t || '_project_idx', t);
    execute format('grant select, insert, update, delete on %I to authenticated', t);
    execute format('revoke all on %I from anon', t);
  end loop;
end $$;
alter table templates enable row level security;
drop policy if exists templates_read on templates;
drop policy if exists templates_staff on templates;
create policy templates_read on templates for select to authenticated using (my_role() is not null);
create policy templates_staff on templates for all to authenticated using (is_staff()) with check (is_staff());
grant select, insert, update, delete on templates to authenticated;
revoke all on templates from anon;

create or replace function checklist_item_same_project() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from checklists c where c.id = new.checklist_id and c.project_id = new.project_id) then
    raise exception 'checklist belongs to another project';
  end if;
  return new;
end $$;
drop trigger if exists checklist_item_check on checklist_items;
create trigger checklist_item_check before insert or update of checklist_id, project_id on checklist_items
  for each row execute function checklist_item_same_project();
revoke execute on function checklist_item_same_project() from anon, authenticated, public;

-- plantillas de ejemplo
insert into templates (name, items)
select * from (values
  ('Inicio de obra', '[{"body":"Foto del frente de la casa","needs_photo":true},{"body":"Fotos del área de trabajo antes de empezar","needs_photo":true},{"body":"Daños existentes documentados","needs_photo":true},{"body":"Medidas confirmadas con el plano","needs_photo":false},{"body":"Acceso, llaves y horario confirmados con el cliente","needs_photo":false},{"body":"Contenedor de basura y protección de pisos","needs_photo":true}]'::jsonb),
  ('Sótano: antes de cerrar paredes', '[{"body":"Estructura (framing) terminada","needs_photo":true},{"body":"Eléctrico en bruto con inspección","needs_photo":true},{"body":"Plomería en bruto con inspección","needs_photo":true},{"body":"Aislamiento instalado","needs_photo":true},{"body":"Fotos de cada pared antes de tablaroca","needs_photo":true}]'::jsonb),
  ('Deck o pérgola', '[{"body":"Hoyos y bases de concreto","needs_photo":true},{"body":"Postes a plomo y nivelados","needs_photo":true},{"body":"Vigas y joists","needs_photo":true},{"body":"Tablas y tornillería","needs_photo":true},{"body":"Barandal y escalones","needs_photo":true}]'::jsonb),
  ('Entrega final', '[{"body":"Limpieza terminada","needs_photo":true},{"body":"Fotos finales de cada área","needs_photo":true},{"body":"Recorrido con el cliente","needs_photo":false},{"body":"Pendientes anotados","needs_photo":false},{"body":"Firma de terminación","needs_photo":false}]'::jsonb)
) v(name, items)
where not exists (select 1 from templates);

-- ---------- el cliente ve las fotos marcadas como compartidas ----------
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
    'photos', coalesce((select json_agg(x order by x.taken_at desc) from (select id, path, caption, kind, taken_at from photos where project_id = p.id and shared) x), '[]'),
    'payments', coalesce((select json_agg(x order by x.paid_on) from (select id, paid_on, note, amount from payments where project_id = p.id) x), '[]'),
    'milestones', coalesce((select json_agg(x order by x.sort) from (select id, label, amount, sort from milestones where project_id = p.id) x), '[]'),
    'change_orders', coalesce((select json_agg(x order by x.created_at desc) from (select id, title, details, kind, amount, status, decided_by, decided_at, created_at from change_orders where project_id = p.id and status <> 'draft') x), '[]'),
    'comments', coalesce((select json_agg(x order by x.created_at) from (select id, author, name, body, created_at from comments where project_id = p.id) x), '[]'),
    'documents', coalesce((select json_agg(x order by x.created_at desc) from (select id, kind, lang, snapshot, total, status, signed_by, signed_on, file, created_at from documents where project_id = p.id and status in ('sent','signed')) x), '[]')
  ) into r;
  return r;
end $$;
revoke all on function client_project(text) from public;
grant execute on function client_project(text) to anon, authenticated;
