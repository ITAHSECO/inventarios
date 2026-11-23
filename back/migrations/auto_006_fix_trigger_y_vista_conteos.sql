-- ============================================================
-- AUTO-GENERATED (auto_006) - Ejecutado automáticamente por el asistente
-- Fecha: 2026-11-22
-- Objetivo: Reparar integridad de captura_inventario_conteos
--   1) Eliminar columna residual planilla_id (migracion 003 no aplicada en prod)
--   2) Redefinir trigger de validacion de serie/lote por barrido+codigo
--      (el trigger anterior validaba por NEW.planilla_id, que el backend
--       ya no envia => validacion anulada)
--   3) Recrear vista vw_resumen_diferencias_inventario (join barrido+codigo)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Eliminar la vista que depende de planilla_id (si existe)
-- ------------------------------------------------------------
DROP VIEW IF EXISTS public.vw_resumen_diferencias_inventario;

-- ------------------------------------------------------------
-- 2. Eliminar columna planilla_id (y su FK) si existe
-- ------------------------------------------------------------
ALTER TABLE public.captura_inventario_conteos
  DROP COLUMN IF EXISTS planilla_id;

-- ------------------------------------------------------------
-- 3. Redefinir la funcion del trigger: valida serie/lote buscando
--    maneja_serie_lote en planillasinventario por barrido + codigo.
--    Tambien normaliza ubicacion, serie_lote, almacen y marca.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validar_serie_lote_obligatorio()
RETURNS TRIGGER AS $$
DECLARE
    v_maneja_serie_lote BOOLEAN;
BEGIN
    -- Buscar el flag en la planilla del barrido activo + codigo
    SELECT p.maneja_serie_lote INTO v_maneja_serie_lote
    FROM public.planillasinventario p
    WHERE p.barrido = UPPER(TRIM(NEW.barrido))
      AND p.codigo  = UPPER(TRIM(NEW.codigo))
    LIMIT 1;

    IF v_maneja_serie_lote
       AND (NEW.serie_lote IS NULL OR TRIM(NEW.serie_lote) = '' OR NEW.serie_lote = '-') THEN
        RAISE EXCEPTION 'El artículo requiere un número de Serie/Lote válido para registrar el conteo.';
    END IF;

    NEW.ubicacion := UPPER(TRIM(NEW.ubicacion));
    NEW.serie_lote := UPPER(TRIM(NEW.serie_lote));

    IF NEW.almacen IS NOT NULL THEN
        NEW.almacen := UPPER(TRIM(NEW.almacen));
    END IF;

    IF NEW.marca IS NOT NULL THEN
        NEW.marca := UPPER(TRIM(NEW.marca));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- El trigger trg_conteos_validar_serie_lote ya existe y apunta a esta
-- funcion; al hacer CREATE OR REPLACE no hay que recrearlo. Se verifica:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conteos_validar_serie_lote'
    ) THEN
        CREATE TRIGGER trg_conteos_validar_serie_lote
        BEFORE INSERT OR UPDATE ON public.captura_inventario_conteos
        FOR EACH ROW EXECUTE FUNCTION public.fn_validar_serie_lote_obligatorio();
    END IF;
END $$;

-- ------------------------------------------------------------
-- 4. Recrear la vista con join por barrido + codigo (migracion 004)
--    + nuevas columnas almacen y marca
-- ------------------------------------------------------------
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
  c.cunidad,
  c.serie_lote,
  c.vcto_capturado,
  c.almacen,
  c.marca,
  c.observacion,
  c.inventariador_id,
  c.barrido_id,
  c.created_at
FROM public.captura_inventario_conteos c
JOIN public.planillasinventario p
  ON c.barrido_id IS NOT NULL
  AND p.barrido = c.barrido
  AND p.codigo = c.codigo;

COMMENT ON VIEW public.vw_resumen_diferencias_inventario IS
  'Resumen de diferencias entre conteo fisico y stock teorico (join por barrido+codigo)';
