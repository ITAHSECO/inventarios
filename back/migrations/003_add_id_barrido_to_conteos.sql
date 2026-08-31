-- Migracion: Agregar id_barrido como FK a la tabla captura_inventario_conteos
-- Permite joins directos con la tabla barridos

ALTER TABLE public.captura_inventario_conteos
  ADD COLUMN id_barrido BIGINT REFERENCES public.barridos(id) ON DELETE SET NULL;
