-- ============================================================
-- Inspeccion de SPs en SQL Server (SOLO LECTURA - solo SELECT)
-- Base: rsfaccar | Servidor: SQL Server 2014
--
-- Uso:
--   sqlcmd -S MI_SERVIDOR -d rsfaccar -E -i inspeccionar_sp_saldos.sql -o salida.txt
--   (-E = Windows Auth; si usas usuario SQL: -U usuario -P password)
--
-- Este script NO ejecuta ningun SP ni hace INSERT/UPDATE/DELETE/TRUNCATE.
-- Solo lee definiciones desde sys.sql_modules.
-- ============================================================
SET NOCOUNT ON;

-- ------------------------------------------------------------
-- 1. Estructura de la tabla de movimientos al0007movd
-- ------------------------------------------------------------
SELECT '=== COLUMNAS al0007movd ===' AS seccion;
SELECT c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,
       c.NUMERIC_PRECISION, c.NUMERIC_SCALE, c.IS_NULLABLE, c.ORDINAL_POSITION
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = 'al0007movd'
ORDER BY c.ORDINAL_POSITION;

-- ------------------------------------------------------------
-- 2. Tablas relacionadas (posibles cabeceras de movimiento / saldos)
-- ------------------------------------------------------------
SELECT '=== TABLAS al0007% o que contengan saldos/mov ===' AS seccion;
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND (TABLE_NAME LIKE 'al0007%' OR TABLE_NAME LIKE '%saldo%' OR TABLE_NAME LIKE '%mov%')
ORDER BY TABLE_NAME;

-- ------------------------------------------------------------
-- 3. SPs candidatos: calculan saldo a una fecha
--    (leen al0007movd, o tienen parametros de fecha/saldo)
-- ------------------------------------------------------------
SELECT '=== SPs CANDIDATOS ===' AS seccion;
SELECT o.name AS sp_name,
       LEN(m.definition) AS tam_def,
       CASE WHEN m.definition LIKE '%@fecha%'     OR m.definition LIKE '%@ffecha%'  THEN 'fecha '    ELSE '' END +
       CASE WHEN m.definition LIKE '%saldo%'       THEN 'saldo '   ELSE '' END +
       CASE WHEN m.definition LIKE '%@f1%' OR m.definition LIKE '%@fecha1%' THEN 'rangoFechas ' ELSE '' END +
       CASE WHEN m.definition LIKE '%al0007movd%'  THEN 'lee_movd ' ELSE '' END AS pistas
FROM sys.objects o
JOIN sys.sql_modules m ON m.object_id = o.object_id
WHERE o.type = 'P'
  AND o.name NOT LIKE 'sp_%'          -- excluye SPs del sistema
  AND (
        m.definition LIKE '%al0007movd%'
     OR m.definition LIKE '%saldo%'
  )
ORDER BY o.name;

-- ------------------------------------------------------------
-- 4. SPs con parametros de fecha (rango desde/hasta)
-- ------------------------------------------------------------
SELECT '=== SPs CON PARAMETROS DE FECHA ===' AS seccion;
SELECT o.name AS sp_name, p.name AS parametro, t.name AS tipo
FROM sys.objects o
JOIN sys.parameters p ON p.object_id = o.object_id
JOIN sys.types t ON t.user_type_id = p.user_type_id
WHERE o.type = 'P'
  AND o.name NOT LIKE 'sp_%'
  AND (p.name LIKE '%fecha%' OR p.name LIKE '%ffecha%' OR p.name LIKE '%f1%' OR p.name LIKE '%f2%')
ORDER BY o.name, p.parameter_id;

-- ------------------------------------------------------------
-- 5. Definicion completa de los SPs candidatos (para leer a mano)
--    Se limita a 20 para no inundar la salida.
-- ------------------------------------------------------------
SELECT '=== DEFINICIONES ===' AS seccion;
SELECT TOP 20
       o.name AS sp_name,
       m.definition
FROM sys.objects o
JOIN sys.sql_modules m ON m.object_id = o.object_id
WHERE o.type = 'P'
  AND o.name NOT LIKE 'sp_%'
  AND (m.definition LIKE '%al0007movd%' OR m.definition LIKE '%saldo%')
ORDER BY o.name;

PRINT 'Fin de la inspeccion (solo lectura).';
