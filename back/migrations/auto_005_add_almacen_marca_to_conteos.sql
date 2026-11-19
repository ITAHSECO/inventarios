-- ============================================================
-- AUTO-GENERATED (auto_005) - Ejecutado automáticamente por el asistente
-- Tabla: public.captura_inventario_conteos
-- Objetivo: Agregar campos almacen y marca para registro en captura
-- ============================================================

ALTER TABLE public.captura_inventario_conteos
  ADD COLUMN IF NOT EXISTS almacen VARCHAR(100),
  ADD COLUMN IF NOT EXISTS marca VARCHAR(100);

COMMENT ON COLUMN public.captura_inventario_conteos.almacen IS 'Almacen fisico capturado en campo';
COMMENT ON COLUMN public.captura_inventario_conteos.marca IS 'Marca capturada en campo';
