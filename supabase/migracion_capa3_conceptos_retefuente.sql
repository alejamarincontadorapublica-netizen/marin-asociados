-- ============================================================
-- CAPA 3 — Conceptos de ReteFuente editables (Configuración)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Catálogo de conceptos, bases mínimas (UVT) y tarifas de Retención en la
-- Fuente. Editable desde el módulo Configuración — NO se deja fijo en el
-- código porque la norma (Decreto 572 de 2025) ha sido muy volátil.
create table if not exists conceptos_retefuente (
  id          uuid primary key default gen_random_uuid(),
  concepto    text not null,
  base_uvt    numeric not null default 0,
  tarifa      numeric not null,
  activo      boolean not null default true,
  updated_at  timestamptz not null default now()
);

alter table conceptos_retefuente enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'conceptos_retefuente' AND policyname = 'acceso_autenticado'
  ) THEN
    CREATE POLICY "acceso_autenticado" ON conceptos_retefuente
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Valores de configuración simples (clave/valor), ej. UVT vigente
create table if not exists configuracion_valores (
  clave       text primary key,
  valor       jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table configuracion_valores enable row level security;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'configuracion_valores' AND policyname = 'acceso_autenticado'
  ) THEN
    CREATE POLICY "acceso_autenticado" ON configuracion_valores
      FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END$$;

-- Siembra inicial (solo si la tabla está vacía) — tarifas vigentes desde el
-- 1 de julio de 2026 según Decreto 572 de 2025. Alejandra debe verificar y
-- mantener actualizado desde Configuración.
INSERT INTO conceptos_retefuente (concepto, base_uvt, tarifa)
SELECT * FROM (VALUES
  ('Compras generales (declarante)',            10,  2.5),
  ('Compras generales (no declarante)',         10,  3.5),
  ('Productos agrícolas sin procesar',           70,  1.5),
  ('Servicios generales (declarante)',            2,  4),
  ('Servicios generales (no declarante)',         2,  6),
  ('Transporte de carga',                         2,  1),
  ('Transporte de pasajeros terrestre',          10,  3.5),
  ('Servicios temporales (sobre AIU)',             2,  1),
  ('Vigilancia y aseo (sobre AIU)',                2,  2),
  ('Hoteles y restaurantes',                       2,  3.5),
  ('Arrendamiento de bienes muebles',              0,  4),
  ('Arrendamiento de bienes inmuebles',           10,  3.5),
  ('Honorarios / comisiones (persona jurídica)',   0,  11),
  ('Honorarios / comisiones (no declarante)',      0,  10),
  ('Rendimientos financieros',                     0,  7),
  ('Contratos de construcción',                   10,  2),
  ('Otros ingresos tributarios',                  10,  2.5)
) AS v(concepto, base_uvt, tarifa)
WHERE NOT EXISTS (SELECT 1 FROM conceptos_retefuente);

INSERT INTO configuracion_valores (clave, valor)
VALUES ('uvt_vigente', '{"valor": 52374, "anio": 2026}'::jsonb)
ON CONFLICT (clave) DO NOTHING;
