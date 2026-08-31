-- Migracion: Renombrar articulo → descripcion y agregar descripcion a conteos
-- Fecha: 2026-08-31

-- 1. Renombrar columna articulo → descripcion en planillasInventario
ALTER TABLE public.planillasinventario RENAME COLUMN articulo TO descripcion;

-- 2. Agregar columna descripcion a captura_inventario_conteos
ALTER TABLE public.captura_inventario_conteos ADD COLUMN descripcion VARCHAR(255) NULL;

-- 2b. Agregar columna cunidad a captura_inventario_conteos
ALTER TABLE public.captura_inventario_conteos ADD COLUMN cunidad VARCHAR(20) NULL;

COMMENT ON COLUMN public.planillasinventario.descripcion IS 'Nombre/descripcion del articulo (renombrado desde articulo)';
COMMENT ON COLUMN public.captura_inventario_conteos.descripcion IS 'Descripcion del articulo al momento del conteo';

-- 3. Actualizar la vista si existe
DROP VIEW IF EXISTS public.vw_resumen_diferencias_inventario;
CREATE OR REPLACE VIEW public.vw_resumen_diferencias_inventario AS
SELECT
  c.id,
  c.barrido,
  c.codigo,
  p.descripcion AS descripcion,
  c.ubicacion,
  c.conteo,
  p.existencia,
  c.conteo - p.existencia AS diferencia,
  CASE
    WHEN c.conteo = p.existencia THEN 'EXACTO'
    WHEN c.conteo > p.existencia THEN 'SOBRANTE'
    ELSE 'FALTANTE'
  END AS estado,
  c.serie_lote,
  c.vcto_capturado,
  c.observacion,
  c.inventariador_id,
  c.planilla_id,
  c.created_at
FROM public.captura_inventario_conteos c
JOIN public.planillasinventario p ON c.planilla_id = p.id;
