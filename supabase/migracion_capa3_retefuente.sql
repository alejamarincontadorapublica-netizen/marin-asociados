-- ============================================================
-- CAPA 3 — Retención en la Fuente (ReteFuente)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- ¿Este cliente es agente de retención? (no todos superan los topes de ley)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS es_agente_retencion boolean NOT NULL DEFAULT false;

-- Número de factura/documento (distinto del CUFE), cuando el Excel de la DIAN lo trae
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS numero_documento text;

-- Registro global de terceros (proveedores) que son autorretenedores.
-- No se les practica retención en la fuente. Compartido entre todos los clientes.
create table if not exists terceros_autorretenedores (
  nit         text primary key,
  nombre      text,
  created_at  timestamptz default now()
);

alter table terceros_autorretenedores enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'terceros_autorretenedores' AND policyname = 'acceso_autenticado'
  ) THEN
    CREATE POLICY "acceso_autenticado" ON terceros_autorretenedores
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Retenciones en la fuente practicadas, un registro por documento retenido
create table if not exists retenciones_fuente (
  id               uuid primary key default gen_random_uuid(),
  cliente_id       uuid references clientes(id) on delete cascade,
  documento_id     uuid references documentos(id) on delete cascade,
  periodo_inicio   date not null,
  periodo_fin      date not null,
  concepto         text not null,
  tarifa           numeric not null,
  base             numeric not null,
  valor_retenido   numeric not null,
  created_at       timestamptz default now(),
  unique (documento_id)
);

alter table retenciones_fuente enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'retenciones_fuente' AND policyname = 'acceso_autenticado'
  ) THEN
    CREATE POLICY "acceso_autenticado" ON retenciones_fuente
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END$$;
