-- ============================================================
-- AUTO-GENERATED (auto_010) - Ejecutado automáticamente por el asistente
-- Fecha: 2026-11-24
-- Objetivo: Campo Estado en capturas
--   1) Sembrar catálogo ESTADO en maestra_parametros:
--      1 = VIGENTE, 2 = DETERIORADO, 3 = VENCIDO
--   2) Agregar columna estado VARCHAR(50) a
--      captura_inventario_conteos (guarda id_elemento de la maestra)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Sembrar catálogo ESTADO en la tabla maestra
-- ------------------------------------------------------------
INSERT INTO public.maestra_parametros (id_tabla, id_elemento, descripcion, activo) VALUES
  ('ESTADO', '1', 'VIGENTE', TRUE),
  ('ESTADO', '2', 'DETERIORADO', TRUE),
  ('ESTADO', '3', 'VENCIDO', TRUE)
ON CONFLICT (id_tabla, id_elemento) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Agregar columna estado a captura_inventario_conteos
-- ------------------------------------------------------------
ALTER TABLE public.captura_inventario_conteos
  ADD COLUMN IF NOT EXISTS estado VARCHAR(50);

COMMENT ON COLUMN public.captura_inventario_conteos.estado IS
  'Estado del articulo en el conteo (id_elemento de maestra_parametros id_tabla=ESTADO: 1=VIGENTE, 2=DETERIORADO, 3=VENCIDO)';

-- ------------------------------------------------------------
-- Verificación
-- ------------------------------------------------------------
SELECT id_tabla, id_elemento, descripcion, activo
FROM public.maestra_parametros
WHERE id_tabla = 'ESTADO'
ORDER BY id_elemento;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'captura_inventario_conteos'
  AND column_name = 'estado';
