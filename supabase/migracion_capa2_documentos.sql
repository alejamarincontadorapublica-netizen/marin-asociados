-- ============================================================
-- CAPA 2 — Migración documentos
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Agregar constraint único en cufe para evitar duplicados al re-sincronizar
-- Solo se aplica cuando cufe no es nulo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documentos_cufe_unique'
  ) THEN
    ALTER TABLE documentos ADD CONSTRAINT documentos_cufe_unique UNIQUE (cufe);
  END IF;
END$$;

-- Registrar capa 2 en respaldos
INSERT INTO respaldos (modulo, version, commit_hash, estado)
VALUES ('facturacion_dian', 'v0.2', 'capa-2-facturacion', 'estable')
ON CONFLICT DO NOTHING;
