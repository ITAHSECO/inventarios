-- ============================================================
-- INVENTARIOS - SCRIPT DE RECONSTRUCCION COMPLETA
-- Fecha: 2026-08-31
-- Base de datos: Supabase (PostgreSQL)
-- ============================================================
-- Ejecutar este script en el SQL Editor de Supabase
-- NOTA: Esto ELIMINA y recrea todas las tablas del esquema public
-- ============================================================

-- ============================================================
-- 0. EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TIPO ENUM: app_role
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'inventariador', 'reportes');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. ELIMINAR TABLAS EXISTENTES (en orden por dependencias)
-- ============================================================
DROP TABLE IF EXISTS public.barrido_usuarios CASCADE;
DROP TABLE IF EXISTS public.captura_inventario_conteos CASCADE;
DROP TABLE IF EXISTS public.planillasinventario CASCADE;
DROP TABLE IF EXISTS public.maestra_parametros CASCADE;
DROP TABLE IF EXISTS public.barridos CASCADE;
DROP TABLE IF EXISTS public.perfiles CASCADE;

-- Eliminar vistas
DROP VIEW IF EXISTS public.vw_catalogos_activos CASCADE;
DROP VIEW IF EXISTS public.vw_resumen_diferencias_inventario CASCADE;

-- Eliminar funciones existentes
DROP FUNCTION IF EXISTS public.fn_obtener_rol_usuario() CASCADE;
DROP FUNCTION IF EXISTS public.fn_establecer_pin_supervisor(UUID, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.fn_validar_pin_supervisor(VARCHAR, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.fn_on_auth_user_created() CASCADE;
DROP FUNCTION IF EXISTS public.fn_validar_serie_lote() CASCADE;

-- ============================================================
-- 3. TABLA: perfiles (extension de auth.users)
-- ============================================================
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  rol app_role DEFAULT 'inventariador' NOT NULL,
  pin_autorizacion VARCHAR(255) NULL,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  creado_por UUID REFERENCES public.perfiles(id) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.perfiles IS 'Extension de auth.users con datos de perfil y rol';

-- ============================================================
-- 4. TABLA: maestra_parametros (catalogos centralizados)
-- ============================================================
CREATE TABLE public.maestra_parametros (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tabla VARCHAR(50) NOT NULL,
  id_elemento VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE NOT NULL,
  creado_por UUID REFERENCES public.perfiles(id) NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_modificacion TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT maestra_parametros_unique UNIQUE (id_tabla, id_elemento)
);

COMMENT ON TABLE public.maestra_parametros IS 'Catalogos centralizados del sistema';

-- ============================================================
-- 5. TABLA: barridos (campanas de inventario)
-- ============================================================
CREATE TABLE public.barridos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre VARCHAR(150) UNIQUE NOT NULL,
  estado VARCHAR(20) DEFAULT 'activo' NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  creado_por UUID REFERENCES public.perfiles(id) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.barridos IS 'Cabeceras de campana de inventario';

-- ============================================================
-- 6. TABLA: planillasinventario (catalogo base / snapshot)
-- ============================================================
CREATE TABLE public.planillasinventario (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  barrido VARCHAR(100) NOT NULL,
  id_alm VARCHAR(50) NOT NULL,
  id_marca VARCHAR(50) NULL,
  id_categoria VARCHAR(50) NULL,
  codigo VARCHAR(50) NOT NULL,
  cod_fab VARCHAR(50) NULL,
  existencia NUMERIC(12, 4) DEFAULT 0,
  descripcion VARCHAR(255) NOT NULL,
  cunidad VARCHAR(20) NULL,
  serie_lote VARCHAR(100) DEFAULT '-',
  vcto DATE NULL,
  maneja_serie_lote BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.planillasinventario IS 'Catalogo base / snapshot de barrido de inventario';

-- ============================================================
-- 7. TABLA: captura_inventario_conteos (lecturas de campo)
-- ============================================================
CREATE TABLE public.captura_inventario_conteos (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  planilla_id BIGINT REFERENCES public.planillasinventario(id) ON DELETE RESTRICT,
  barrido VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NULL,
  ubicacion VARCHAR(100) NOT NULL,
  conteo NUMERIC(12, 4) NOT NULL CHECK (conteo >= 0),
  cunidad VARCHAR(20) NULL,
  serie_lote VARCHAR(100) DEFAULT '-' NOT NULL,
  vcto_capturado DATE NULL,
  modificado_por_supervisor BOOLEAN DEFAULT FALSE NOT NULL,
  supervisor_id UUID REFERENCES public.perfiles(id) NULL,
  observacion VARCHAR(255) NULL,
  inventariador_id UUID REFERENCES public.perfiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.captura_inventario_conteos IS 'Lecturas de inventario capturadas en campo';

-- ============================================================
-- 8. TABLA: barrido_usuarios (asignacion de inventariadores)
-- ============================================================
CREATE TABLE public.barrido_usuarios (
  barrido_id BIGINT REFERENCES public.barridos(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
  asignado_por UUID REFERENCES public.perfiles(id) NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (barrido_id, usuario_id)
);

COMMENT ON TABLE public.barrido_usuarios IS 'Asignacion de inventariadores a barridos';

-- ============================================================
-- 9. FUNCION: fn_obtener_rol_usuario()
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_obtener_rol_usuario()
RETURNS public.app_role AS $$
DECLARE
  rol_result public.app_role;
BEGIN
  SELECT rol INTO rol_result FROM public.perfiles WHERE id = auth.uid();
  RETURN rol_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.fn_obtener_rol_usuario() IS 'Retorna el rol del usuario autenticado actual. SECURITY DEFINER para evitar recursion RLS.';

-- ============================================================
-- 10. FUNCION: fn_establecer_pin_supervisor()
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_establecer_pin_supervisor(
  p_usuario_id UUID,
  p_nuevo_pin VARCHAR
) RETURNS VOID AS $$
BEGIN
  UPDATE public.perfiles
  SET pin_autorizacion = crypt(p_nuevo_pin, gen_salt('bf', 8)),
      updated_at = NOW()
  WHERE id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_establecer_pin_supervisor(UUID, VARCHAR) IS 'Establece el PIN de supervisor encriptado con BCrypt.';

-- ============================================================
-- 11. FUNCION: fn_validar_pin_supervisor()
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_validar_pin_supervisor(
  p_username VARCHAR,
  p_pin_ingresado VARCHAR
) RETURNS TABLE(valido BOOLEAN, usuario_id UUID, rol app_role) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (p.pin_autorizacion IS NOT NULL AND p.pin_autorizacion = crypt(p_pin_ingresado, p.pin_autorizacion)) AS valido,
    p.id AS usuario_id,
    p.rol AS rol
  FROM public.perfiles p
  WHERE p.username = p_username AND p.activo = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_validar_pin_supervisor(VARCHAR, VARCHAR) IS 'Valida el PIN de supervisor. Retorna estado de validacion.';

-- ============================================================
-- 12. FUNCION: fn_on_auth_user_created() (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_on_auth_user_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, username, nombres, apellidos, rol)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'nombres',
    NEW.raw_user_meta_data->>'apellidos',
    COALESCE((NEW.raw_user_meta_data->>'rol')::public.app_role, 'inventariador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.fn_on_auth_user_created() IS 'Trigger: auto-crea perfil al registrar usuario en auth.users';

-- ============================================================
-- 13. TRIGGER: trg_on_auth_user_created
-- ============================================================
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_on_auth_user_created();

-- ============================================================
-- 14. FUNCION: fn_validar_serie_lote() (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_validar_serie_lote()
RETURNS TRIGGER AS $$
DECLARE
  v_maneja_serie_lote BOOLEAN;
BEGIN
  SELECT maneja_serie_lote INTO v_maneja_serie_lote
  FROM public.planillasinventario
  WHERE id = NEW.planilla_id;

  IF v_maneja_serie_lote = TRUE THEN
    IF NEW.serie_lote IS NULL OR TRIM(NEW.serie_lote) = '' OR NEW.serie_lote = '-' THEN
      RAISE EXCEPTION 'El articulo maneja serie/lote y requiere un valor valido (no vacio ni "-")';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.fn_validar_serie_lote() IS 'Trigger: valida que serie_lote no este vacio si maneja_serie_lote es TRUE';

-- ============================================================
-- 15. TRIGGER: trg_conteos_validar_serie_lote
-- ============================================================
DROP TRIGGER IF EXISTS trg_conteos_validar_serie_lote ON public.captura_inventario_conteos;
CREATE TRIGGER trg_conteos_validar_serie_lote
  BEFORE INSERT OR UPDATE ON public.captura_inventario_conteos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validar_serie_lote();

-- ============================================================
-- 16. RLS: Habilitar Row Level Security en todas las tablas
-- ============================================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maestra_parametros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planillasinventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captura_inventario_conteos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barridos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barrido_usuarios ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 17. RLS: Politicas para perfiles
-- ============================================================
CREATE POLICY "perfiles_select_auth" ON public.perfiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "perfiles_update_admin" ON public.perfiles
  FOR UPDATE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
    OR id = auth.uid()
  );

CREATE POLICY "perfiles_insert_admin" ON public.perfiles
  FOR INSERT WITH CHECK (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 18. RLS: Politicas para maestra_parametros
-- ============================================================
CREATE POLICY "maestra_select_auth" ON public.maestra_parametros
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "maestra_insert_admin" ON public.maestra_parametros
  FOR INSERT WITH CHECK (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "maestra_update_admin" ON public.maestra_parametros
  FOR UPDATE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 19. RLS: Politicas para planillasinventario
-- ============================================================
CREATE POLICY "planillas_select_auth" ON public.planillasinventario
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "planillas_insert_admin" ON public.planillasinventario
  FOR INSERT WITH CHECK (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "planillas_update_admin" ON public.planillasinventario
  FOR UPDATE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "planillas_delete_admin" ON public.planillasinventario
  FOR DELETE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 20. RLS: Politicas para captura_inventario_conteos
-- ============================================================
CREATE POLICY "conteos_select" ON public.captura_inventario_conteos
  FOR SELECT USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin', 'reportes')
    OR inventariador_id = auth.uid()
  );

CREATE POLICY "conteos_insert" ON public.captura_inventario_conteos
  FOR INSERT WITH CHECK (
    inventariador_id = auth.uid()
  );

CREATE POLICY "conteos_update" ON public.captura_inventario_conteos
  FOR UPDATE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
    OR (
      inventariador_id = auth.uid()
      AND modificado_por_supervisor = FALSE
    )
  );

CREATE POLICY "conteos_delete" ON public.captura_inventario_conteos
  FOR DELETE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 21. RLS: Politicas para barridos
-- ============================================================
CREATE POLICY "barridos_select_auth" ON public.barridos
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "barridos_insert_admin" ON public.barridos
  FOR INSERT WITH CHECK (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "barridos_update_admin" ON public.barridos
  FOR UPDATE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "barridos_delete_admin" ON public.barridos
  FOR DELETE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 22. RLS: Politicas para barrido_usuarios
-- ============================================================
CREATE POLICY "barrido_usuarios_select_auth" ON public.barrido_usuarios
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "barrido_usuarios_insert_admin" ON public.barrido_usuarios
  FOR INSERT WITH CHECK (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

CREATE POLICY "barrido_usuarios_delete_admin" ON public.barrido_usuarios
  FOR DELETE USING (
    fn_obtener_rol_usuario() IN ('superadmin', 'admin')
  );

-- ============================================================
-- 23. VISTA: vw_catalogos_activos
-- ============================================================
CREATE OR REPLACE VIEW public.vw_catalogos_activos AS
SELECT id, id_tabla, id_elemento, descripcion, activo, fecha_creacion, fecha_modificacion
FROM public.maestra_parametros
WHERE activo = TRUE;

COMMENT ON VIEW public.vw_catalogos_activos IS 'Vista filtrada de catalogos activos';

-- ============================================================
-- 24. VISTA: vw_resumen_diferencias_inventario
-- ============================================================
CREATE OR REPLACE VIEW public.vw_resumen_diferencias_inventario AS
SELECT
  c.id,
  c.barrido,
  c.codigo,
  c.descripcion,
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
  c.observacion,
  c.inventariador_id,
  c.planilla_id,
  c.created_at
FROM public.captura_inventario_conteos c
LEFT JOIN public.planillasinventario p ON c.planilla_id = p.id;

COMMENT ON VIEW public.vw_resumen_diferencias_inventario IS 'Resumen de diferencias entre conteo fisico y stock teorico';
