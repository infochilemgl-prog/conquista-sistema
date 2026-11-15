-- NexoSolar Leads — esquema de base de datos
-- Pégalo en Supabase → SQL Editor → New query → Run

-- Tabla principal: leads
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre text not null,
  telefono text not null,
  email text,
  comuna text,
  direccion text,
  tipo_vivienda text check (tipo_vivienda in ('casa','departamento')),
  es_dueno boolean,
  tramo_boleta text check (tramo_boleta in
    ('menos_40k','40_70k','70_140k','mas_140k')),
  techo_sol text check (techo_sol in ('si','no','no_se')),
  plazo text check (plazo in ('asap','30_dias','mas_1_mes')),
  estado text not null default 'Lead' check (estado in
    ('Lead','Contactado','Cita agendada',
     'Cotización entregada','Trabajo ganado')),
  valor_estimado numeric,
  origen text default 'Meta',
  notas text
);

-- Citas / agenda
create table citas (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  fecha timestamptz not null,
  notas text,
  created_at timestamptz not null default now()
);

-- Seguridad (RLS)
alter table leads enable row level security;
alter table citas enable row level security;

-- El formulario público puede INSERTAR sin login:
create policy "insert publico" on leads
  for insert to anon with check (true);

-- El dueño (logueado) ve y edita todo:
create policy "auth total leads" on leads
  for all to authenticated using (true) with check (true);
create policy "auth total citas" on citas
  for all to authenticated using (true) with check (true);
