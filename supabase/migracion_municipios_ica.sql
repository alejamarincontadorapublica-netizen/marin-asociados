-- Agregar columna de municipios ICA (array sin límite de elementos)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS municipios_ica text[] DEFAULT '{}';
