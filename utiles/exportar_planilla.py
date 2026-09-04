"""
Exporta inventario desde SQL Server 2014 a CSV para carga masiva en planillas.
Solo funciona en red local.

Uso:
  python utiles/exportar_planilla.py --barrido "BARRIDO-001" --output planilla.csv

Requisitos:
  pip install pyodbc
  ODBC Driver 17 for SQL Server (https://docs.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
"""

import argparse
import csv
import sys
from datetime import datetime

try:
    import pyodbc
except ImportError:
    print("Error: pyodbc no esta instalado.")
    print("Ejecuta: pip install pyodbc")
    print("Tambien necesitas ODBC Driver 17 for SQL Server")
    sys.exit(1)

# Configuracion de conexion - EDITAR SEGUN TU ENTORNO
SQL_SERVER_CONFIG = {
    "driver": "{ODBC Driver 17 for SQL Server}",
    "server": "TU_SERVIDOR\\INSTANCIA",  # ej: MI_SERVIDOR\\SQLEXPRESS
    "database": "TU_BASE_DE_DATOS",
    "trusted_connection": "yes",  # Windows Authentication
    # Si usas autenticacion SQL, comenta trusted_connection y usa:
    # "uid": "tu_usuario",
    # "pwd": "tu_password",
    "timeout": 60,
}

# Mapeo: columnas SP → columnas CSV planilla
COLUMN_MAP = {
    "ID_ALM": "id_alm",
    "ID_MARCA": "id_marca",
    "ID_CATEGORIA": "id_categoria",
    "CODIGO": "codigo",
    "COD.FAB": "cod_fab",
    "EXISTENCIA": "existencia",
    "ARTICULO": "descripcion",
    "CUNIDAD": "cunidad",
    "SERIE_LOTE": "serie_lote",
    "VCTO": "vcto",
    "MANEJA_SERIE_LOTE": "maneja_serie_lote",
}


def build_connection_string(config):
    parts = []
    for k, v in config.items():
        parts.append(f"{k}={v}")
    return ";".join(parts)


def normalize_date(value):
    """Convierte various formatos de fecha a YYYY-MM-DD."""
    if not value or str(value).strip() in ("", "0", "None"):
        return ""
    value = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return value


def normalize_boolean(value):
    """Convierte a true/false para JSON."""
    if value is None:
        return "false"
    v = str(value).strip().lower()
    if v in ("1", "true", "si", "sí", "yes"):
        return "true"
    return "false"


def normalize_string(value):
    """Limpia y formatea a mayusculas."""
    if value is None:
        return ""
    return str(value).strip().upper()


def export(config, barrido, output_file, sp_name="QINVENTARIO"):
    conn_str = build_connection_string(config)
    print(f"Conectando a {config['server']}...")
    print(f"Base de datos: {config['database']}")

    try:
        conn = pyodbc.connect(conn_str, **{
            k: v for k, v in config.items()
            if k in ("driver", "server", "database", "trusted_connection",
                      "uid", "pwd", "timeout")
        })
    except pyodbc.Error as e:
        print(f"Error de conexion: {e}")
        print("\nVerifica:")
        print("  1. ODBC Driver 17 esta instalado")
        print("  2. El servidor y instancia son correctos")
        print("  3. La base de datos existe")
        print("  4. Tienes permisos de acceso")
        sys.exit(1)

    cursor = conn.cursor()
    print(f"Ejecutando SP: {sp_name}...")

    try:
        cursor.execute(f"EXEC {sp_name}")
    except pyodbc.Error as e:
        print(f"Error al ejecutar SP: {e}")
        conn.close()
        sys.exit(1)

    columns = [desc[0] for desc in cursor.description]
    print(f"Columnas recibidas: {', '.join(columns)}")

    rows = cursor.fetchall()
    print(f"Registros obtenidos: {len(rows)}")

    if len(rows) == 0:
        print("No se obtuvieron registros. Verifica que el SP retorna datos.")
        conn.close()
        sys.exit(0)

    # Verificar que las columnas mapeadas existen
    missing = [col for col in COLUMN_MAP.keys() if col not in columns]
    if missing:
        print(f"\nAdvertencia: Columnas no encontradas en el resultado del SP:")
        for m in missing:
            print(f"  - {m}")
        print(f"\nColumnas disponibles: {', '.join(columns)}")
        print("\nAjusta COLUMN_MAP en el script segun las columnas reales.")
        # Filtrar solo columnas que existen
        valid_map = {k: v for k, v in COLUMN_MAP.items() if k in columns}
    else:
        valid_map = COLUMN_MAP

    # Mapear datos
    csv_headers = list(valid_map.values())
    mapped_rows = []

    for row in rows:
        row_dict = dict(zip(columns, row))
        csv_row = {}
        for src_col, dst_col in valid_map.items():
            value = row_dict.get(src_col)

            if dst_col == "vcto":
                csv_row[dst_col] = normalize_date(value)
            elif dst_col == "maneja_serie_lote":
                csv_row[dst_col] = normalize_boolean(value)
            elif dst_col == "existencia":
                try:
                    csv_row[dst_col] = float(value) if value else 0
                except (ValueError, TypeError):
                    csv_row[dst_col] = 0
            elif dst_col == "codigo" or dst_col == "id_alm":
                csv_row[dst_col] = normalize_string(value)
            else:
                csv_row[dst_col] = normalize_string(value) if value else ""

        mapped_rows.append(csv_row)

    conn.close()

    # Escribir CSV
    print(f"\nGenerando CSV: {output_file}")
    with open(output_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_headers)
        writer.writeheader()
        writer.writerows(mapped_rows)

    print(f"Exportacion completada: {len(mapped_rows)} registros")
    print(f"\nPara subir al sistema, usa:")
    print(f'  Barrido: "{barrido}"')
    print(f'  CSV: {output_file}')


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Exportar inventario SQL Server a CSV para carga masiva"
    )
    parser.add_argument(
        "--barrido", required=True,
        help="Nombre del barrido destino (ej: BARRIDO-001)"
    )
    parser.add_argument(
        "--output", "-o", default=None,
        help="Archivo CSV de salida (default: planilla_BARRIDO.csv)"
    )
    parser.add_argument(
        "--sp", default="QINVENTARIO",
        help="Nombre del SP (default: QINVENTARIO)"
    )
    parser.add_argument(
        "--server", default=None,
        help="Servidor SQL (ej: MI_SERVIDOR\\SQLEXPRESS)"
    )
    parser.add_argument(
        "--database", default=None,
        help="Nombre de la base de datos"
    )
    parser.add_argument(
        "--user", default=None,
        help="Usuario SQL (si no usa Windows Auth)"
    )
    parser.add_argument(
        "--password", default=None,
        help="Password SQL (si no usa Windows Auth)"
    )
    args = parser.parse_args()

    # Aplicar argumentos de linea de comandos
    if args.server:
        SQL_SERVER_CONFIG["server"] = args.server
    if args.database:
        SQL_SERVER_CONFIG["database"] = args.database
    if args.user and args.password:
        SQL_SERVER_CONFIG.pop("trusted_connection", None)
        SQL_SERVER_CONFIG["uid"] = args.user
        SQL_SERVER_CONFIG["pwd"] = args.password

    output = args.output or f"planilla_{args.barrido.replace(' ', '_')}.csv"

    export(SQL_SERVER_CONFIG, args.barrido, output, args.sp)
