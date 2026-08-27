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

---

## 7. ARQUITECTURA DEL BACKEND (Node.js + Express)

### Stack Técnico
- **Runtime**: Node.js >= 22.0.0 (requerido por @supabase/supabase-js para WebSocket nativo)
- **Framework**: Express.js 4.x
- **DB Client**: @supabase/supabase-js 2.49+ (dual client: service role + user context)
- **Validación**: Zod (schemas por módulo)
- **Seguridad**: Helmet, CORS, Rate Limiting (express-rate-limit)
- **Logging**: Pino + pino-pretty (desarrollo)
- **Documentación**: Swagger UI (swagger-jsdoc + swagger-ui-express)

### Estructura de Carpetas
```
back/
├── .env                          # Variables de entorno (NO se commitea)
├── .env.example                  # Plantilla de variables
├── package.json                  # Dependencias y scripts
├── render.yaml                   # Config IaC para Render
└── src/
    ├── index.js                  # Entry point (server startup)
    ├── app.js                    # Express app (middleware + rutas)
    ├── config/
    │   ├── index.js              # Config centralizada (lee .env)
    │   ├── supabase.js           # Dual client (admin + anon + user context)
    │   └── swagger.js            # Config OpenAPI 3.0
    ├── middleware/
    │   ├── auth.js               # JWT auth via Supabase
    │   ├── rbac.js               # Role-based access control
    │   ├── pin.js                # Validación PIN supervisor
    │   ├── validate.js           # Zod validation
    │   ├── errorHandler.js       # Error handler centralizado
    │   └── rateLimiter.js        # Rate limiting
    ├── routes/                   # 6 grupos de rutas con JSDoc
    ├── controllers/              # Lógica request/response
    ├── services/                 # Lógica de negocio + Supabase
    ├── validators/               # Schemas Zod por módulo
    └── utils/                    # ApiError, apiResponse, logger, normalize
```

### Dual Supabase Client
El backend usa **dos clientes** Supabase por request:
1. **Service Role Client** (`supabaseAdmin`): Bypasea RLS. Solo para operaciones admin.
2. **User Context Client** (`createUserClient(token)`): Respeta RLS. Para operaciones de campo.

**NUNCA** exponer `SUPABASE_SERVICE_ROLE_KEY` al frontend.

---

## 8. ENDPOINTS API (`/api`)

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | `/signup` | Registrar usuario | Público |
| POST | `/login` | Iniciar sesión | Público |
| POST | `/logout` | Cerrar sesión | Autenticado |
| GET | `/me` | Obtener perfil actual | Autenticado |
| POST | `/refresh` | Refrescar token | Público |
| PUT | `/password` | Cambiar contraseña | Autenticado |

### Perfiles (`/api/perfiles`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/` | Listar perfiles (paginado) | superadmin, admin |
| GET | `/:id` | Obtener perfil | Autenticado |
| POST | `/` | Crear perfil | superadmin |
| PUT | `/:id` | Actualizar perfil | superadmin, admin |
| PUT | `/:id/pin` | Establecer PIN | superadmin, admin |
| POST | `/validate-pin` | Validar PIN | superadmin, admin |

### Catálogos (`/api/catalogos`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/` | Listar catálogos (paginado) | Autenticado |
| GET | `/activos` | Vista de catálogos activos | Autenticado |
| GET | `/tablas` | Tipos de tabla únicos | Autenticado |
| GET | `/:id` | Obtener catálogo | Autenticado |
| POST | `/` | Crear catálogo | superadmin, admin |
| PUT | `/:id` | Actualizar catálogo | superadmin, admin |

### Planillas (`/api/planillas`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/` | Listar planillas (paginado) | Autenticado |
| GET | `/barridos` | Códigos de barrido únicos | Autenticado |
| GET | `/almacenes` | Almacenes únicos | Autenticado |
| GET | `/:id` | Obtener planilla | Autenticado |
| GET | `/:id/conteos` | Conteos de una planilla | Autenticado |
| POST | `/` | Crear planilla | superadmin, admin |
| POST | `/bulk` | Carga masiva de planillas | superadmin, admin |
| PUT | `/:id` | Actualizar planilla | superadmin, admin |
| DELETE | `/:id` | Eliminar planilla | superadmin |

### Conteos (`/api/conteos`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/mis-conteos` | Conteos del inventariador | inventariador |
| GET | `/` | Listar conteos (paginado) | Autenticado |
| GET | `/:id` | Obtener conteo | Autenticado |
| POST | `/` | Crear conteo (captura campo) | inventariador, admin, superadmin |
| POST | `/bulk` | Carga masiva (sync offline) | inventariador, admin, superadmin |
| PUT | `/:id` | Actualizar conteo | inventor, admin, superadmin |
| PUT | `/:id/supervisor-edit` | Edición supervisor (requiere PIN) | admin, superadmin |
| DELETE | `/:id` | Eliminar conteo | admin, superadmin |

### Reportes (`/api/reportes`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/dashboard` | Métricas agregadas | Autenticado |
| GET | `/resumen-diferencias` | Resumen paginado de diferencias | Autenticado |
| GET | `/resumen-diferencias-completo` | Resumen completo (EXACTO/SOBRANTE/FALTANTE) | Autenticado |

---

## 9. DESPLIEGUE EN RENDER

### Configuración del Servicio
| Campo | Valor |
|-------|-------|
| Name | `inventarios-api` |
| Runtime | Node |
| Root Directory | `back` |
| Build Command | `npm install` |
| Start Command | `node src/index.js` |
| Health Check | `/health` |

### Variables de Entorno (Render)
```
NODE_ENV=production
NODE_VERSION=22
PORT=10000
SUPABASE_URL=https://mgapfghsthvkxgpslgic.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
CORS_ORIGINS=https://inventarios-d4uj.onrender.com,https://itahseco.github.io
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=20
```

### URLs de Despliegue
- **API**: `https://inventarios-d4uj.onrender.com`
- **Swagger UI**: `https://inventarios-d4uj.onrender.com/docs`
- **OpenAPI Spec**: `https://inventarios-d4uj.onrender.com/api/docs.json`
- **Health Check**: `https://inventarios-d4uj.onrender.com/health`

### CORS
El backend acepta requests desde:
- `https://inventarios-d4uj.onrender.com` (producción)
- `https://itahseco.github.io` (frontend en GitHub Pages)
- `http://localhost:5173` (desarrollo local Vite)
- `http://localhost:3000` (desarrollo local)

Headers permitidos: `Content-Type`, `Authorization`, `X-Supervisor-Pin`, `X-Supervisor-Username`

---

## 10. ESTRUCTURA DEL PROYECTO

```
inventarios/
├── context.MD                    # Este archivo (contexto del proyecto)
├── back/                         # Backend Node.js (API REST)
│   ├── .env                      # Variables de entorno (NO commitear)
│   ├── .env.example              # Plantilla
│   ├── package.json              # Dependencias
│   ├── render.yaml               # Config Render IaC
│   └── src/                      # Código fuente
├── front/                        # Frontend (archivos estáticos para GitHub Pages)
├── postman/                      # Colecciones Postman para testing
│   └── Inventarios_API.postman_collection.json
└── utiles/                       # Utilidades de soporte (Python/ejecutables)
```

---

## 11. CONSIDERACIONES PARA EL FRONTEND

### Autenticación
- El frontend debe almacenar `access_token` y `refresh_token` de Supabase
- Enviar `Authorization: Bearer <access_token>` en cada request
- Refrescar el token antes de que expire (usa el endpoint `/api/auth/refresh`)

### RLS y Permisos
- El frontend debe respetar los roles: solo mostrar botones/acciones según el rol del usuario
- Los inventariadores solo ven sus propios conteos
- La edición de supervisor requiere PIN (header `X-Supervisor-Pin`)

### Offline Sync (Capturas de Campo)
- Las capturas pueden crearse en modo offline usando `POST /api/conteos/bulk`
- Incluir `client_capture_id` (UUID) para idempotencia
- Sincronizar cuando haya conectividad

### Paginación Estándar
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 25,
    "totalPages": 6
  }
}
```

### Normalización
El backend automáticamente aplica `UPPER(TRIM())` a:
- Claves de catálogos (id_tabla, id_elemento)
- Ubicaciones
- Series/Lotes
- Códigos de barrido y almacén

---

## 12. COLECCIONES POSTMAN

El archivo `postman/Inventarios_API.postman_collection.json` contiene requests para todos los endpoints organizados por módulo:
- Health Check
- Auth (signup, login, logout, me, refresh, password)
- Perfiles (CRUD + PIN)
- Catálogos (CRUD + activos + tablas)
- Planillas (CRUD + bulk + barridos/almacenes)
- Conteos (CRUD + bulk + supervisor-edit + mis-conteos)
- Reportes (dashboard + resumen-diferencias)

Variables de colección:
- `baseUrl`: `http://localhost:3000/api` (cambiar según entorno)
- `token`: Se auto-asigna tras login exitoso
- `userId`: Se auto-asigna tras login exitoso
