-- ============================================================
-- AUTO-GENERATED (auto_011) - Ejecutado automáticamente por el asistente
-- Fecha: 2026-11-25
-- Objetivo: Hacer configurable el campo "Estado" en capturas
--   Agrega 'estado' a config_campos_captura para que el admin pueda
--   activar/desactivar y marcar obligatorio desde #/admin/config-captura.
-- ============================================================

INSERT INTO public.config_campos_captura (campo, activo, obligatorio) VALUES
  ('estado', TRUE, FALSE)
ON CONFLICT (campo) DO NOTHING;

-- Verificacion
SELECT campo, activo, obligatorio
FROM public.config_campos_captura
ORDER BY campo;
