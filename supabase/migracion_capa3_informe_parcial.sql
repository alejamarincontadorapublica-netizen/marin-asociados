-- ============================================================
-- CAPA 3 — Informes parciales de IVA dentro de un periodo fiscal
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Distingue si una liquidación cubre el periodo fiscal completo (final)
-- o es un corte parcial dentro del periodo, para control periódico.
ALTER TABLE resultados
  ADD COLUMN IF NOT EXISTS es_final boolean NOT NULL DEFAULT true;
