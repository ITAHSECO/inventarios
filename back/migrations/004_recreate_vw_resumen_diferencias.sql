-- Migracion: Recrear vista vw_resumen_diferencias_inventario con barrido_id
-- Fecha: 2026-09-03
-- Razon: La vista anterior usaba planilla_id que fue eliminado en migracion 003

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
  c.cunidad,
  c.observacion,
  c.inventariador_id,
  c.barrido_id,
  c.created_at
FROM public.captura_inventario_conteos c
JOIN public.planillasinventario p
  ON c.barrido_id IS NOT NULL
  AND p.barrido = c.barrido
  AND p.codigo = c.codigo;

COMMENT ON VIEW public.vw_resumen_diferencias_inventario IS 'Resumen de diferencias entre conteo fisico y stock teorico (join por barrido+codigo)';
