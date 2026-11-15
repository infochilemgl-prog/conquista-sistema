-- ============================================================
-- NexoVolt Leads — esquema v2 (multi-tenant)
-- Pégalo completo en Supabase → SQL Editor → Run.
--
-- ⚠️ ESTE SCRIPT BORRA las tablas v1 (leads, citas) y sus datos.
-- Las tablas del módulo de ventas (prospectos, actividades) no se tocan.
-- ============================================================

drop table if exists lead_tags cascade;
drop table if exists tags cascade;
drop table if exists mensajes cascade;
drop table if exists tareas_automaticas cascade;
drop table if exists citas cascade;
drop table if exists leads cascade;
drop table if exists perfiles cascade;
drop table if exists clientes cascade;
drop function if exists es_owner();
drop function if exists mi_cliente();

-- ------------------------------------------------------------
-- Tablas
-- ------------------------------------------------------------

-- Instaladores (tenants)
create table clientes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre_empresa text not null,
  slug text not null unique,          -- para /captar/:slug
  comuna text,
  logo_url text,
  color_primario text default '#1F6FD6',
  zona_cobertura text,
  owner_user_id uuid
);

-- Usuarios ligados a Supabase Auth
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'installer' check (rol in ('owner','installer')),
  cliente_id uuid references clientes(id)
);

-- Leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  created_at timestamptz not null default now(),
  nombre text not null,
  telefono text not null,
  email text,
  comuna text,
  direccion text,
  tipo_vivienda text check (tipo_vivienda in ('casa','departamento')),
  es_dueno boolean,
  tramo_boleta text check (tramo_boleta in ('menos_40k','40_70k','70_140k','mas_140k')),
  techo_sol text check (techo_sol in ('si','no','no_se')),
  plazo text check (plazo in ('asap','30_dias','mas_1_mes')),
  estado text not null default 'Lead' check (estado in
    ('Lead','Contactado','Cita agendada','Cotización entregada','Trabajo ganado')),
  valor_estimado numeric,
  origen text default 'Manual',       -- Manual | Formulario | Meta | Demo
  asignado_a uuid references perfiles(id),
  dnd_whatsapp boolean not null default false,
  dnd_email boolean not null default false,
  dnd_llamadas boolean not null default false,
  notas text
);

-- Etiquetas y relación N:M
create table tags (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  nombre text not null,
  color text default '#1F6FD6'
);
create table lead_tags (
  lead_id uuid references leads(id) on delete cascade,
  tag_id uuid references tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);

-- Mensajes (conversaciones)
create table mensajes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  cliente_id uuid references clientes(id) on delete cascade,
  direccion text not null check (direccion in ('in','out')),
  canal text not null default 'whatsapp' check (canal in ('whatsapp','sms','email')),
  texto text not null,
  created_at timestamptz not null default now(),
  enviado_por text default 'manual'   -- manual | auto | ia
);

-- Citas
create table citas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  fecha timestamptz not null,
  notas text,
  google_event_id text,
  created_at timestamptz not null default now()
);

-- Automatizaciones programadas
create table tareas_automaticas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  tipo text not null,                 -- confirmacion | recordatorio | seguimiento | nurture | aviso_interno
  canal text not null default 'whatsapp',
  programada_para timestamptz not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','enviada','cancelada')),
  payload text
);

create index idx_leads_cliente on leads(cliente_id);
create index idx_mensajes_lead on mensajes(lead_id, created_at);
create index idx_citas_cliente_fecha on citas(cliente_id, fecha);
create index idx_tareas_pendientes on tareas_automaticas(estado, programada_para);

-- ------------------------------------------------------------
-- Funciones de autorización (evitan recursión en RLS)
-- ------------------------------------------------------------

create function es_owner() returns boolean
language sql security definer stable set search_path = public as
$$ select exists(select 1 from perfiles where id = auth.uid() and rol = 'owner') $$;

create function mi_cliente() returns uuid
language sql security definer stable set search_path = public as
$$ select cliente_id from perfiles where id = auth.uid() $$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table clientes enable row level security;
alter table perfiles enable row level security;
alter table leads enable row level security;
alter table tags enable row level security;
alter table lead_tags enable row level security;
alter table mensajes enable row level security;
alter table citas enable row level security;
alter table tareas_automaticas enable row level security;

-- clientes: anon lee branding (formulario público); auth lee el suyo; owner todo
create policy "anon lee clientes" on clientes for select to anon using (true);
create policy "auth lee su cliente" on clientes for select to authenticated
  using (es_owner() or id = mi_cliente());
create policy "owner escribe clientes" on clientes for all to authenticated
  using (es_owner()) with check (es_owner());

-- perfiles: cada uno ve el suyo y los de su cliente; owner ve y administra todos
create policy "lee perfiles" on perfiles for select to authenticated
  using (id = auth.uid() or es_owner() or cliente_id is not distinct from mi_cliente());
create policy "owner escribe perfiles" on perfiles for all to authenticated
  using (es_owner()) with check (es_owner());

-- leads: anon solo inserta (formulario público); auth por tenant
create policy "anon inserta leads" on leads for insert to anon with check (true);
create policy "auth total leads" on leads for all to authenticated
  using (es_owner() or cliente_id = mi_cliente())
  with check (es_owner() or cliente_id = mi_cliente());

-- tags
create policy "auth total tags" on tags for all to authenticated
  using (es_owner() or cliente_id = mi_cliente())
  with check (es_owner() or cliente_id = mi_cliente());

-- lead_tags (autoriza vía el lead)
create policy "auth total lead_tags" on lead_tags for all to authenticated
  using (exists (select 1 from leads l where l.id = lead_id
                 and (es_owner() or l.cliente_id = mi_cliente())))
  with check (exists (select 1 from leads l where l.id = lead_id
                 and (es_owner() or l.cliente_id = mi_cliente())));

-- mensajes
create policy "auth total mensajes" on mensajes for all to authenticated
  using (es_owner() or cliente_id = mi_cliente())
  with check (es_owner() or cliente_id = mi_cliente());

-- citas
create policy "auth total citas" on citas for all to authenticated
  using (es_owner() or cliente_id = mi_cliente())
  with check (es_owner() or cliente_id = mi_cliente());

-- tareas_automaticas: anon inserta (el formulario crea confirmación/nurture)
create policy "anon inserta tareas" on tareas_automaticas for insert to anon
  with check (estado = 'pendiente');
create policy "auth total tareas" on tareas_automaticas for all to authenticated
  using (es_owner() or cliente_id = mi_cliente())
  with check (es_owner() or cliente_id = mi_cliente());

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
alter publication supabase_realtime add table mensajes;
alter publication supabase_realtime add table leads;

-- ------------------------------------------------------------
-- Datos iniciales — EDITA Y DESCOMENTA:
-- 1) Crea tu primer cliente (instalador):
-- insert into clientes (nombre_empresa, slug, comuna) values ('Mi Instalador Solar', 'mi-instalador', 'Viña del Mar');
--
-- 2) Crea tu usuario en Authentication → Users → Add user, copia su UUID y:
-- insert into perfiles (id, nombre, rol) values ('UUID-DE-TU-USUARIO', 'Mateo', 'owner');
-- ------------------------------------------------------------
