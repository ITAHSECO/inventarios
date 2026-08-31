-- Migracion 003: Limpiar FKs en captura_inventario_conteos + ampliar cunidad

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

  -- Ampliar cunidad a 50 chars en ambas tablas
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'cunidad' AND character_maximum_length < 50) THEN
    ALTER TABLE public.captura_inventario_conteos ALTER COLUMN cunidad TYPE VARCHAR(50);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planillasinventario' AND column_name = 'cunidad' AND character_maximum_length < 50) THEN
    ALTER TABLE public.planillasinventario ALTER COLUMN cunidad TYPE VARCHAR(50);
  END IF;
END $$;
