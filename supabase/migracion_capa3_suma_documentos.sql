-- ============================================================
-- CAPA 3 — Columna "suma" en documentos (base real para ReteFuente)
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- La DIAN entrega "SUMA" (base gravada + excluida/exceptuada) como el
-- valor antes de IVA sobre el que se calcula la Retención en la Fuente,
-- distinto de "BASE IVA" (que solo cubre lo gravado con IVA).
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS suma numeric;
