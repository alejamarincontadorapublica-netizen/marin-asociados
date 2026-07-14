-- ============================================================
-- CAPA 3 — Permitir editar NIT/nombre de terceros autorretenedores
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Antes el NIT era la llave primaria, lo que impedía corregirlo si se
-- digitó mal (ej. falta el dígito de verificación). Se cambia a un id
-- propio y el NIT queda como campo único editable.
ALTER TABLE terceros_autorretenedores ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
UPDATE terceros_autorretenedores SET id = gen_random_uuid() WHERE id IS NULL;
ALTER TABLE terceros_autorretenedores ALTER COLUMN id SET NOT NULL;

ALTER TABLE terceros_autorretenedores DROP CONSTRAINT IF EXISTS terceros_autorretenedores_pkey;
ALTER TABLE terceros_autorretenedores ADD PRIMARY KEY (id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'terceros_autorretenedores_nit_unique'
  ) THEN
    ALTER TABLE terceros_autorretenedores ADD CONSTRAINT terceros_autorretenedores_nit_unique UNIQUE (nit);
  END IF;
END$$;
