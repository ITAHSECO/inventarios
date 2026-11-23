-- ============================================================
-- AUTO-GENERATED (auto_007) - Ejecutado automáticamente por el asistente
-- Fecha: 2026-11-22
-- Objetivo: Configuracion de campos del formulario de captura
--   Permite al admin activar/desactivar campos y marcarlos
--   como obligatorios desde el dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.config_campos_captura (
  campo VARCHAR(50) PRIMARY KEY,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  obligatorio BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID NULL REFERENCES public.perfiles(id)
);

COMMENT ON TABLE public.config_campos_captura IS
  'Configuracion de visibilidad y obligatoriedad de campos del formulario de captura';

-- Semilla: valores por defecto (iguales al comportamiento actual)
INSERT INTO public.config_campos_captura (campo, activo, obligatorio) VALUES
  ('codigo',       TRUE,  FALSE),
  ('unidad',       TRUE,  TRUE),
  ('descripcion',  TRUE,  FALSE),
  ('ubicacion',    TRUE,  TRUE),
  ('conteo',       TRUE,  TRUE),
  ('almacen',      TRUE,  FALSE),
  ('marca',        TRUE,  FALSE),
  ('serie_lote',   TRUE,  FALSE),
  ('vcto',         TRUE,  FALSE),
  ('observacion',  TRUE,  FALSE)
ON CONFLICT (campo) DO NOTHING;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.config_campos_captura ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RLS_config_campos_select" ON public.config_campos_captura;
CREATE POLICY "RLS_config_campos_select"
  ON public.config_campos_captura FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "RLS_config_campos_update" ON public.config_campos_captura;
CREATE POLICY "RLS_config_campos_update"
  ON public.config_campos_captura FOR UPDATE
  TO authenticated
  USING (public.fn_obtener_rol_usuario() IN ('superadmin', 'admin'))
  WITH CHECK (public.fn_obtener_rol_usuario() IN ('superadmin', 'admin'));

-- Solo superadmin puede insertar filas nuevas
DROP POLICY IF EXISTS "RLS_config_campos_insert" ON public.config_campos_captura;
CREATE POLICY "RLS_config_campos_insert"
  ON public.config_campos_captura FOR INSERT
  TO authenticated
  WITH CHECK (public.fn_obtener_rol_usuario() = 'superadmin');

-- Verificacion
SELECT campo, activo, obligatorio
FROM public.config_campos_captura
ORDER BY campo;
