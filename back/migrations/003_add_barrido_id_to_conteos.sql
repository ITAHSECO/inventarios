-- Migracion: Limpiar foreign keys en captura_inventario_conteos
-- 1. Eliminar id_barrido (duplicado)
-- 2. Asegurar barrido_id como FK a barridos
-- 3. Eliminar planilla_id

DO $$
BEGIN
  -- Eliminar id_barrido si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'id_barrido') THEN
    ALTER TABLE public.captura_inventario_conteos DROP COLUMN id_barrido;
  END IF;

  -- Eliminar planilla_id si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'planilla_id') THEN
    ALTER TABLE public.captura_inventario_conteos DROP COLUMN planilla_id;
  END IF;

  -- Asegurar que barrido_id existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'barrido_id') THEN
    ALTER TABLE public.captura_inventario_conteos ADD COLUMN barrido_id BIGINT REFERENCES public.barridos(id) ON DELETE SET NULL;
  END IF;
END $$;
