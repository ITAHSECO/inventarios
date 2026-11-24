-- ============================================================
-- AUTO-GENERATED (auto_009) - Ejecutado automaticamente por el asistente
-- Fecha: 2026-11-23
-- Objetivo: Borrado en cascada de barridos con sus conteos
--   La FK captura_inventario_conteos.barrido_id estaba en NO ACTION
--   (confdeltype='a'), lo que impedia eliminar un barrido que tuviera
--   conteos asociados (error de integridad referencial).
--   Se cambia a ON DELETE CASCADE para que al eliminar un barrido
--   se eliminen automaticamente sus conteos de captura.
--   Nota: barrido_usuarios.barrido_id ya era ON DELETE CASCADE (no se toca).
--   Nota: planillasinventario referencia el barrido solo por nombre
--   (sin FK), por lo que NO se ve afectada por este cambio.
-- ============================================================

ALTER TABLE public.captura_inventario_conteos
  DROP CONSTRAINT captura_inventario_conteos_barrido_id_fkey;

ALTER TABLE public.captura_inventario_conteos
  ADD CONSTRAINT captura_inventario_conteos_barrido_id_fkey
  FOREIGN KEY (barrido_id)
  REFERENCES public.barridos(id)
  ON DELETE CASCADE;

-- Verificacion: confdeltype debe ser 'c' (CASCADE)
SELECT conname,
       confdeltype,
       CASE confdeltype
         WHEN 'a' THEN 'NO ACTION'
         WHEN 'r' THEN 'RESTRICT'
         WHEN 'c' THEN 'CASCADE'
         WHEN 'n' THEN 'SET NULL'
         WHEN 'd' THEN 'SET DEFAULT'
       END AS comportamiento
FROM pg_constraint
WHERE conrelid = 'captura_inventario_conteos'::regclass
  AND confrelid = 'barridos'::regclass;
