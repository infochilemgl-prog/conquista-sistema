-- NexoSolar Leads — módulo de ventas (prospección de instaladores)
-- Pégalo en Supabase → SQL Editor → New query → Run

-- Prospectos: empresas instaladoras que Mateo contacta
create table prospectos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nombre_empresa text not null,
  contacto_nombre text,
  telefono text,
  email text,
  instagram text,
  sitio_web text,
  region text,
  comuna text,
  fuente text default 'Google' check (fuente in
    ('ACESOL','SEC','Google','Instagram','Referido','Otro')),
  estado text not null default 'Por contactar' check (estado in
    ('Por contactar','Contactado','Respondió','Llamada agendada',
     'Propuesta enviada','Cliente','Descartado')),
  llamada_fecha timestamptz,
  proximo_seguimiento date,
  ultimo_contacto timestamptz,
  notas text
);

-- Actividades: cada mensaje enviado, llamada hecha o nota.
-- Es la fuente del contador de disciplina diaria.
create table actividades (
  id uuid primary key default gen_random_uuid(),
  prospecto_id uuid references prospectos(id) on delete cascade,
  tipo text not null check (tipo in ('mensaje','llamada','reunion','nota')),
  detalle text,
  created_at timestamptz not null default now()
);

-- Seguridad: solo el dueño logueado
alter table prospectos enable row level security;
alter table actividades enable row level security;

create policy "auth total prospectos" on prospectos
  for all to authenticated using (true) with check (true);
create policy "auth total actividades" on actividades
  for all to authenticated using (true) with check (true);
