-- Capa 2 — AIU por documento
-- Permite que cada lote de documentos tenga su propio porcentaje AIU,
-- independiente del porcentaje por defecto registrado en el cliente.
-- NULL significa "usar el porcentaje del cliente".
ALTER TABLE documentos
  ADD COLUMN IF NOT EXISTS aiu_porcentaje numeric;
