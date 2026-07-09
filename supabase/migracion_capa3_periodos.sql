-- ============================================================
-- CAPA 3 — Periodos fiscales de IVA + arrastre de saldo
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Periodicidad de IVA propia de cada cliente (bimestral o cuatrimestral)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS periodicidad_iva text
  CHECK (periodicidad_iva IN ('bimestral', 'cuatrimestral'));

-- Evita liquidaciones duplicadas del mismo cliente/periodo/impuesto
-- y permite re-guardar (upsert) si se recalcula un periodo ya liquidado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'resultados_periodo_unique'
  ) THEN
    ALTER TABLE resultados
      ADD CONSTRAINT resultados_periodo_unique UNIQUE (cliente_id, periodo_inicio, periodo_fin, tipo);
  END IF;
END$$;
