-- Migracion: Agregar barrido_id como FK a la tabla captura_inventario_conteos
-- Permite joins directos con la tabla barridos

-- Si ya existe la columna id_barrido de una migracion previa, renombrarla
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'id_barrido') THEN
    ALTER TABLE public.captura_inventario_conteos RENAME COLUMN id_barrido TO barrido_id;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'captura_inventario_conteos' AND column_name = 'barrido_id') THEN
    ALTER TABLE public.captura_inventario_conteos ADD COLUMN barrido_id BIGINT REFERENCES public.barridos(id) ON DELETE SET NULL;
  END IF;
END $$;
