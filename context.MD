# INSTRUCCIONES DE CONTEXTO Y ARQUITECTURA: MODELO DE BASE DE DATOS E INFRAESTRUCTURA DE SEGURIDAD

Actúa como un Arquitecto de Software Senior y Desarrollador Full-Stack. Estoy construyendo una aplicación de capturas de inventario en campo basada en Supabase (PostgreSQL).

A continuación, te proporciono la especificación completa del modelo de base de datos, funciones, triggers, vistas y políticas de seguridad Row Level Security (RLS) para que tengas contexto absoluto del backend.

---

## 1. ROLES Y JERARQUÍA DE USUARIOS
El sistema utiliza un ENUM `public.app_role` con los siguientes niveles:
- `superadmin`: Control total sobre usuarios, catálogos, planillas, conteos y configuraciones.
- `admin`: Gestión de inventariadores, edición de parámetros, carga de planillas y supervisor en campo (autorización por PIN).
- `inventariador`: Captura de datos en campo. Solo lee catálogos/planillas y gestiona sus propios conteos no cerrados.
- `reportes`: Acceso de solo lectura a vistas consolidadas y métricas.

---

## 2. ESQUEMA DE BASE DE DATOS (TABLAS)

### A. `public.perfiles` (Extensión de `auth.users`)
- `id` (UUID, PK, FK `auth.users.id` ON DELETE CASCADE)
- `username` (VARCHAR(50), UNIQUE, NOT NULL)
- `nombres` (VARCHAR(100), NOT NULL)
- `apellidos` (VARCHAR(100), NOT NULL)
- `rol` (app_role, DEFAULT 'inventariador', NOT NULL)
- `pin_autorizacion` (VARCHAR(255), NULL) -> Hash BCrypt para supervisión en campo.
- `activo` (BOOLEAN, DEFAULT TRUE, NOT NULL)
- `creado_por` (UUID, FK `public.perfiles.id`, NULL)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### B. `public.maestra_parametros` (Catálogos Centralizados)
- `id` (BIGINT, GENERATED ALWAYS AS IDENTITY, PK)
- `id_tabla` (VARCHAR(50), NOT NULL) -> Ej. 'ALMACEN', 'MARCA', 'CATEGORIA'
- `id_elemento` (VARCHAR(50), NOT NULL)
- `descripcion` (VARCHAR(255), NOT NULL)
- `activo` (BOOLEAN, DEFAULT TRUE, NOT NULL)
- `creado_por` (UUID, FK `public.perfiles.id`, NULL)
- `fecha_creacion`, `fecha_modificacion` (TIMESTAMPTZ)
*Constraint UNIQUE:* `(id_tabla, id_elemento)`

### C. `public.planillasInventario` (Catálogo Base / Snapshot de Barrido)
- `id` (BIGINT, GENERATED ALWAYS AS IDENTITY, PK)
- `barrido` (VARCHAR(100), NOT NULL)
- `id_alm` (VARCHAR(50), NOT NULL)
- `id_marca`, `id_categoria` (VARCHAR(50), NULL)
- `codigo` (VARCHAR(50), NOT NULL)
- `cod_fab` (VARCHAR(50), NULL)
- `existencia` (NUMERIC(12, 4), DEFAULT 0) -> Stock teórico
- `articulo` (VARCHAR(255), NOT NULL)
- `cunidad` (VARCHAR(20), NULL)
- `serie_lote` (VARCHAR(100), DEFAULT '-')
- `vcto` (DATE, NULL)
- `maneja_serie_lote` (BOOLEAN, DEFAULT FALSE)
- `created_at` (TIMESTAMPTZ)

### D. `public.captura_inventario_conteos` (Lecturas de Campo)
- `id` (BIGINT, GENERATED ALWAYS AS IDENTITY, PK)
- `planilla_id` (BIGINT, FK `public.planillasInventario.id`, RESTRICT, NOT NULL)
- `barrido` (VARCHAR(100), NOT NULL)
- `codigo` (VARCHAR(50), NOT NULL)
- `ubicacion` (VARCHAR(100), NOT NULL)
- `conteo` (NUMERIC(12, 4), CHECK >= 0, NOT NULL)
- `serie_lote` (VARCHAR(100), DEFAULT '-', NOT NULL)
- `vcto_capturado` (DATE, NULL)
- `modificado_por_supervisor` (BOOLEAN, DEFAULT FALSE, NOT NULL)
- `supervisor_id` (UUID, FK `public.perfiles.id`, NULL)
- `observacion` (VARCHAR(255), NULL)
- `inventariador_id` (UUID, FK `public.perfiles.id`, NOT NULL)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## 3. LÓGICA DE NEGOCIO Y REGLAS AUTOMÁTICAS (TRIGGERS Y FUNCIONES)

1. **Auto-Creación de Perfiles:**
   - Trigger `trg_on_auth_user_created` en `auth.users`: Al registrar un usuario, extrae `username`, `nombres`, `apellidos` y `rol` de `raw_user_meta_data` e inserta automáticamente en `public.perfiles`.
2. **Validación de Serie/Lote:**
   - Trigger `trg_conteos_validar_serie_lote` en `captura_inventario_conteos`: Consulta `planillasInventario.maneja_serie_lote`. Si es `TRUE`, rechaza la inserción/edición si el `serie_lote` capturado es vacío, nulo o '-'.
3. **Normalización:**
   - Formateo a mayúsculas y eliminación de espacios en blanco (`UPPER(TRIM())`) para claves en maestra, ubicaciones y series/lotes.
4. **Verificación de PIN Supervisor:**
   - `public.fn_establecer_pin_supervisor(p_usuario_id, p_nuevo_pin)`: Encripta PIN con `crypt(p_nuevo_pin, gen_salt('bf', 8))`.
   - `public.fn_validar_pin_supervisor(p_username, p_pin_ingresado)`: Comprueba credenciales y devuelve estado de validación para autorizar ediciones críticas en el cliente.

---

## 4. POLÍTICAS DE SEGURIDAD (RLS - ROW LEVEL SECURITY)

Se utiliza una función optimizada `SECURITY DEFINER` llamada `public.fn_obtener_rol_usuario()` para validar permisos sin generar recursión:
- **`perfiles`:** Lectura para autenticados. Edición según rol/jerarquía.
- **`maestra_parametros` y `planillasInventario`:** Lectura pública para autenticados. Inserción/Edición exclusiva para `superadmin` y `admin`.
- **`captura_inventario_conteos`:**
  - `SELECT`: `superadmin`, `admin` y `reportes` ven todo. `inventariador` solo ve sus propios registros (`inventariador_id = auth.uid()`).
  - `INSERT`: Requiere que `inventariador_id = auth.uid()`.
  - `UPDATE`: `superadmin` y `admin` pueden editar siempre. El `inventariador` solo si es su propio registro Y `modificado_por_supervisor = FALSE`.
  - `DELETE`: Exclusivo de `superadmin` y `admin`.

---

## 5. VISTAS DISPONIBLES
- `public.vw_catalogos_activos`: Filtro directo de la tabla maestra.
- `public.vw_resumen_diferencias_inventario`: Consolidado agregando conteos vs. stock teórico (`existencia`), clasificando automáticamente el estado (`EXACTO`, `SOBRANTE`, `FALTANTE`).

---

## 6 credenciales
-Project ID: mgapfghsthvkxgpslgic
-Project url: https://mgapfghsthvkxgpslgic.supabase.co
-Punishable API KEY: sb_publishable_PLynSBFi2-mmZ46z9soBbA_nK6uUN0M
-Secret Key: sb_secret_7gP3ZDj1cNZtLIk_kztowA_hh8Z9Uyn
-db: m4ximOabr1l524+
-anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYXBmZ2hzdGh2a3hncHNsZ2ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTY2NzAsImV4cCI6MjA4MzQ3MjY3MH0.qdb8dbvjGmXDK1FPsk5pz4rdugpOla2cqyefAxSxQBY
-service role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYXBmZ2hzdGh2a3hncHNsZ2ljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg5NjY3MCwiZXhwIjoyMDgzNDcyNjcwfQ.kx7mH3YcaMl4vJr3pNmpwQ94f4LtLdHWslXIfcSmfW4
