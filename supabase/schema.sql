-- ============================================================
-- MARÍN & ASOCIADOS — Esquema de base de datos
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Tabla de clientes
create table if not exists clientes (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  tipo          text not null check (tipo in ('empresa', 'natural')),
  nit           text,
  cedula        text,
  cedula_rl     text,
  regimen       text check (regimen in ('ordinario', 'simple')),
  ciiu          text,
  municipio     text,
  plan          text check (plan in ('base', 'metodo_marin', 'firma_premium')),
  factura_aiu   boolean default false,
  porcentaje_aiu numeric,
  created_at    timestamptz default now()
);

-- Tabla de documentos (facturas, notas DIAN)
create table if not exists documentos (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  tipo_documento  text,
  grupo           text check (grupo in ('Emitido', 'Recibido')),
  cufe            text,
  fecha_emision   date,
  nit_emisor      text,
  nombre_emisor   text,
  base            numeric,
  iva             numeric,
  total           numeric,
  clasificacion   text check (clasificacion in ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'IGNORAR')),
  cuenta_puc      text,
  deducible       text check (deducible in ('deducible', 'no_deducible', 'revisar')),
  created_at      timestamptz default now()
);

-- Tabla de resultados tributarios
create table if not exists resultados (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      uuid references clientes(id) on delete cascade,
  periodo_inicio  date,
  periodo_fin     date,
  iva_generado    numeric,
  iva_descontable numeric,
  saldo           numeric,
  tipo            text,
  detalle         jsonb,
  created_at      timestamptz default now()
);

-- Tabla de obligaciones tributarias
create table if not exists obligaciones (
  id                 uuid primary key default gen_random_uuid(),
  cliente_id         uuid references clientes(id) on delete cascade,
  tipo               text,
  fecha_vencimiento  date,
  estado             text check (estado in ('al_dia', 'proximo', 'urgente', 'vencido')),
  monto              numeric
);

-- Tabla de log de agentes
create table if not exists agentes_log (
  id          uuid primary key default gen_random_uuid(),
  agente      text check (agente in ('CEO','CFO','COO','CMO','CSCO','CHRO','CCO')),
  cliente_id  uuid references clientes(id) on delete set null,
  accion      text,
  estado      text check (estado in ('ok','error','pendiente')),
  detalle     jsonb,
  created_at  timestamptz default now()
);

-- Tabla de respaldos del sistema
create table if not exists respaldos (
  id          uuid primary key default gen_random_uuid(),
  modulo      text,
  version     text,
  commit_hash text,
  estado      text check (estado in ('estable','experimental')),
  created_at  timestamptz default now()
);

-- Registrar la Capa 0 como estable
insert into respaldos (modulo, version, commit_hash, estado)
values ('fundacion', 'v0.1', 'capa-0-inicial', 'estable');

-- ============================================================
-- Seguridad: RLS (Row Level Security)
-- Solo el usuario autenticado puede ver y modificar datos
-- ============================================================

alter table clientes    enable row level security;
alter table documentos  enable row level security;
alter table resultados  enable row level security;
alter table obligaciones enable row level security;
alter table agentes_log enable row level security;
alter table respaldos   enable row level security;

-- Política: solo usuarios autenticados tienen acceso total
create policy "acceso_autenticado" on clientes
  for all using (auth.role() = 'authenticated');

create policy "acceso_autenticado" on documentos
  for all using (auth.role() = 'authenticated');

create policy "acceso_autenticado" on resultados
  for all using (auth.role() = 'authenticated');

create policy "acceso_autenticado" on obligaciones
  for all using (auth.role() = 'authenticated');

create policy "acceso_autenticado" on agentes_log
  for all using (auth.role() = 'authenticated');

create policy "acceso_autenticado" on respaldos
  for all using (auth.role() = 'authenticated');
