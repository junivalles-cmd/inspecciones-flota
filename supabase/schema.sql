-- Sistema de Inspecciones de Flota v3 — esquema inicial (Etapa 1)
-- Pegar completo en el SQL Editor de Supabase (proyecto nuevo y propio de esta app).
-- Mismo modelo que ESPECIFICACION.md sección 5, adaptado a Postgres.

create extension if not exists "pgcrypto";

-- ---------- perfiles ----------
-- Un renglón por persona real, ligado a auth.users (Supabase Auth).
create table perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique,          -- lo que la persona escribe para entrar (sin "@...")
  nombre text not null,                  -- nombre para mostrar y para el campo "usuario" de cada inspección
  rol text not null check (rol in ('admin', 'inspector')),
  creado timestamptz not null default now()
);

-- ---------- equipos ----------
create table equipos (
  id text primary key,                   -- "E001", "E002"... (igual que el id oculto de la v2)
  codigo text not null unique,
  codigo2 text not null default '',      -- "Ahorrativo"
  descripcion text not null default '',
  modelo text not null default '',
  ubicacion text not null default '',
  flota text not null,                   -- CAT | KOMATSU | VOLQUETES | AUXILIAR
  proveedor text not null default '',
  afex boolean not null default false,
  rodajes boolean not null default false,
  baldes boolean not null default false,
  implementos boolean not null default false,
  activo boolean not null default true,
  actualizado timestamptz not null default now()
);

create unique index equipos_codigo2_idx on equipos (codigo2) where codigo2 <> '';

-- ---------- config ----------
create table config (
  tipo text primary key,                 -- GENERAL | AFEX_INSP | AFEX_MANT | AFEX_CERT | RODAJES | BALDES | IMPLEMENTOS
  frecuencia_dias int not null,
  anticipacion_dias int not null
);

insert into config (tipo, frecuencia_dias, anticipacion_dias) values
  ('GENERAL', 30, 10),
  ('AFEX_INSP', 30, 10),
  ('AFEX_MANT', 90, 15),
  ('AFEX_CERT', 365, 30),
  ('RODAJES', 30, 10),
  ('BALDES', 30, 10),
  ('IMPLEMENTOS', 30, 10);

-- ---------- inspecciones ----------
create table inspecciones (
  id text primary key,                   -- mismo id que ya usan los registros existentes
  equipo_id text not null references equipos (id),
  codigo text not null,                  -- código del equipo al momento de registrar (snapshot para Historial)
  tipo text not null,
  fecha date not null,
  proveedor text not null default '',
  inspector text not null default '',
  resultado text not null default '',
  obs text not null default '',
  archivos jsonb not null default '[]',  -- [{ "nombre": "...", "drive_file_id": "...", "url": "..." }]
  creado timestamptz not null default now(),
  usuario text not null default '',      -- nombre de quien registró (perfiles.nombre al momento de guardar)
  actualizado timestamptz not null default now()
);

create index inspecciones_equipo_tipo_idx on inspecciones (equipo_id, tipo, fecha desc);

-- ---------- RLS ----------
alter table perfiles enable row level security;
alter table equipos enable row level security;
alter table config enable row level security;
alter table inspecciones enable row level security;

-- Cualquier autenticado puede leer todo.
create policy perfiles_select on perfiles for select to authenticated using (true);
create policy equipos_select on equipos for select to authenticated using (true);
create policy config_select on config for select to authenticated using (true);
create policy inspecciones_select on inspecciones for select to authenticated using (true);

-- Registrar/editar inspecciones: cualquier autenticado.
create policy inspecciones_insert on inspecciones for insert to authenticated with check (true);
create policy inspecciones_update on inspecciones for update to authenticated using (true);
create policy inspecciones_delete on inspecciones for delete to authenticated using (true);

-- Función auxiliar: ¿el usuario autenticado es admin?
create or replace function es_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol = 'admin'
  );
$$;

-- Equipos y configuración: solo admin escribe.
create policy equipos_write on equipos for all to authenticated using (es_admin()) with check (es_admin());
create policy config_write on config for all to authenticated using (es_admin()) with check (es_admin());
