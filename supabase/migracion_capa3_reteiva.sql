-- ============================================================
-- CAPA 3 — Certificados de Retención de IVA (ReteIVA)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Tabla de certificados de ReteIVA
-- Pueden existir varios certificados por periodo (distintos agentes
-- retenedores). El periodo_inicio/periodo_fin es el periodo AL QUE SE
-- CRUZA el certificado, que puede ser distinto del periodo en que se
-- practicó la retención (ej. certificados atrasados que el cliente
-- entrega tarde).
create table if not exists certificados_reteiva (
  id                      uuid primary key default gen_random_uuid(),
  cliente_id              uuid references clientes(id) on delete cascade,
  periodo_inicio          date not null,
  periodo_fin             date not null,
  nit_agente_retenedor    text not null,
  nombre_agente_retenedor text,
  numero_certificado      text,
  monto_retenido          numeric not null,
  archivo_ruta            text,
  archivo_nombre          text,
  created_at              timestamptz default now()
);

alter table certificados_reteiva enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'certificados_reteiva' AND policyname = 'acceso_autenticado'
  ) THEN
    CREATE POLICY "acceso_autenticado" ON certificados_reteiva
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Bucket privado para los archivos de certificados (PDF/imagen)
insert into storage.buckets (id, name, public)
values ('reteiva-certificados', 'reteiva-certificados', false)
on conflict (id) do nothing;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'reteiva_certificados_acceso'
  ) THEN
    CREATE POLICY "reteiva_certificados_acceso" ON storage.objects
      FOR ALL
      USING (bucket_id = 'reteiva-certificados' AND auth.role() = 'authenticated')
      WITH CHECK (bucket_id = 'reteiva-certificados' AND auth.role() = 'authenticated');
  END IF;
END$$;
