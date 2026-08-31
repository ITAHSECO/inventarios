-- Migracion: Integridad de barrido_id en captura_inventario_conteos
-- Eliminar id_barrido (duplicado) y asegurar barrido_id como FK unica

DO $$
BEGIN
  -- Eliminar id_barrido si existe
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'id_barrido') THEN
    ALTER TABLE public.captura_inventario_conteos DROP COLUMN id_barrido;
  END IF;

  -- Asegurar que barrido_id existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'barrido_id') THEN
    ALTER TABLE public.captura_inventario_conteos ADD COLUMN barrido_id BIGINT REFERENCES public.barridos(id) ON DELETE SET NULL;
  END IF;
END $$;

