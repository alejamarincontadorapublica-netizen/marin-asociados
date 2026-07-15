-- ============================================================
-- CAPA 3 — Autorrenta (anticipo a la renta mensual)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Tarifa de autorrenta por cliente, según su actividad económica (CIIU)
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS tarifa_autorrenta numeric;

-- EXCLUIDOS/EXCEPTOS: la DIAN los nombra distinto en compras y ventas,
-- pero es el mismo concepto (valor sin IVA que tampoco es la base de IVA).
-- Junto con BASE IVA arma la base real de retención/autorrenta.
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS excluidos numeric;
