#!/usr/bin/env python3
"""
actualizar_datos.py - Agente de actualizacion de datos del Dashboard
====================================================================
Descarga el Excel desde OneDrive, lo convierte a data.json y lo sube a GitHub Pages.

Uso:
  python actualizar_datos.py          # Descarga, convierte y sube a GitHub
  python actualizar_datos.py --local  # Solo descarga y convierte (sin push)

Requisitos:
  - Python 3.x
  - openpyxl (pip install openpyxl)
  - git configurado con acceso al repositorio
"""

import json
import os
import subprocess
import sys
from datetime import datetime

# ── CONFIGURACION ──
ONEDRIVE_URL = 'https://proxylogis-my.sharepoint.com/personal/carlosu_hernandez_mecanicatek_com/_layouts/15/download.aspx?share=IQD1veTLe2bTQIoFUNNe7y3yAbHvcj7IDM0w9biOCEQXTLw'
SHEET_NAME = 'bd'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_JSON = os.path.join(SCRIPT_DIR, 'data.json')
EXCEL_TEMP = os.path.join(SCRIPT_DIR, '_temp_dashboard.xlsx')

# Columnas del Excel (0-indexed)
COL = {
    'equipo': 4, 'tipo_equipo': 8, 'marca': 10, 'modelo': 11,
    'razon': 13, 'refaccion': 32, 'mano_obra': 33, 'otros': 34,
    'total': 35, 'dias_real': 40, 'dias_atraso': 41, 'nodo': 45,
    'region': 46, 'clasificacion': 63, 'tipo_servicio': 64,
    'tiempo': 68, 'familia': 69, 'mes': 70, 'ano': 71, 'grupo': 7
}


def log(msg):
    print(f'[{datetime.now().strftime("%H:%M:%S")}] {msg}')


def download_excel():
    """Descarga el Excel desde OneDrive usando urllib (sin dependencias externas)."""
    import urllib.request
    log('Descargando Excel desde OneDrive...')
    req = urllib.request.Request(ONEDRIVE_URL, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    })
    try:
        response = urllib.request.urlopen(req, timeout=30)
        data = response.read()
        if len(data) < 1000:
            raise Exception(f'Archivo muy pequeno ({len(data)} bytes), posible error')
        with open(EXCEL_TEMP, 'wb') as f:
            f.write(data)
        log(f'Descargado: {len(data):,} bytes -> {EXCEL_TEMP}')
        return True
    except Exception as e:
        log(f'ERROR descargando: {e}')
        return False


def parse_excel():
    """Parsea el Excel y genera la lista de registros."""
    try:
        import openpyxl
    except ImportError:
        log('ERROR: openpyxl no instalado. Ejecuta: pip install openpyxl')
        sys.exit(1)

    log(f'Parseando Excel (hoja: {SHEET_NAME})...')
    wb = openpyxl.load_workbook(EXCEL_TEMP, read_only=True, data_only=True)

    if SHEET_NAME in wb.sheetnames:
        ws = wb[SHEET_NAME]
    else:
        ws = wb[wb.sheetnames[0]]
        log(f'  Hoja "{SHEET_NAME}" no encontrada, usando "{ws.title}"')

    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    log(f'  {len(rows)} filas leidas (incluye encabezado)')

    def safe_float(v):
        try:
            return float(v) if v is not None else 0
        except (ValueError, TypeError):
            return 0

    def safe_str(v):
        return str(v).strip() if v is not None else ''

    records = []
    for row in rows[1:]:  # Skip header
        if len(row) <= COL['equipo'] or not row[COL['equipo']]:
            continue
        records.append({
            'equipo': safe_str(row[COL['equipo']]),
            'tipo_equipo': safe_str(row[COL['tipo_equipo']]),
            'marca': safe_str(row[COL['marca']]),
            'modelo': safe_str(row[COL['modelo']]),
            'razon_reparacion': safe_str(row[COL['razon']]),
            'precio_refaccion': safe_float(row[COL['refaccion']]),
            'precio_mano_obra': safe_float(row[COL['mano_obra']]),
            'precio_otros': safe_float(row[COL['otros']]),
            'total': safe_float(row[COL['total']]),
            'dias_real': safe_float(row[COL['dias_real']]),
            'dias_atraso': safe_float(row[COL['dias_atraso']]),
            'nodo': safe_str(row[COL['nodo']]),
            'region': safe_str(row[COL['region']]),
            'clasificacion': safe_str(row[COL['clasificacion']]) if len(row) > COL['clasificacion'] else '',
            'tipo_servicio': safe_str(row[COL['tipo_servicio']]) if len(row) > COL['tipo_servicio'] else '',
            'tiempo_estandar': safe_float(row[COL['tiempo']]) if len(row) > COL['tiempo'] else 0,
            'familia': safe_str(row[COL['familia']]) if len(row) > COL['familia'] else '',
            'mes': safe_str(row[COL['mes']]).lower() if len(row) > COL['mes'] else '',
            'ano': safe_str(row[COL['ano']]) if len(row) > COL['ano'] else '',
            'grupo_manto': safe_str(row[COL['grupo']]),
        })

    log(f'  {len(records)} registros validos extraidos')
    return records


def save_json(records):
    """Guarda los registros como data.json."""
    output = {
        'updated': datetime.now().isoformat(),
        'count': len(records),
        'data': records
    }
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = os.path.getsize(OUTPUT_JSON) / 1024
    log(f'Guardado: {OUTPUT_JSON} ({size_kb:.0f} KB, {len(records)} registros)')


def git_push():
    """Commit y push a GitHub."""
    log('Subiendo a GitHub...')
    try:
        subprocess.run(['git', 'add', 'data.json'], cwd=SCRIPT_DIR, check=True, capture_output=True)
        ts = datetime.now().strftime('%Y-%m-%d %H:%M')
        result = subprocess.run(
            ['git', 'commit', '-m', f'Actualizar datos: {ts}'],
            cwd=SCRIPT_DIR, capture_output=True, text=True
        )
        if result.returncode != 0:
            if 'nothing to commit' in result.stdout or 'nothing to commit' in result.stderr:
                log('Sin cambios en los datos - no hay nada que subir')
                return True
            log(f'ERROR en commit: {result.stderr}')
            return False

        result = subprocess.run(
            ['git', 'push', 'origin', 'master'],
            cwd=SCRIPT_DIR, capture_output=True, text=True
        )
        if result.returncode != 0:
            log(f'ERROR en push: {result.stderr}')
            return False

        log('Push exitoso a GitHub Pages')
        return True
    except FileNotFoundError:
        log('ERROR: git no encontrado en PATH')
        return False


def cleanup():
    """Limpia archivos temporales."""
    if os.path.exists(EXCEL_TEMP):
        os.remove(EXCEL_TEMP)


def main():
    local_only = '--local' in sys.argv

    print('=' * 50)
    print('  AGENTE DE ACTUALIZACION - Dashboard Flota')
    print('=' * 50)
    print()

    # Paso 1: Descargar Excel
    if not download_excel():
        log('FALLO: No se pudo descargar el Excel')
        cleanup()
        sys.exit(1)

    # Paso 2: Parsear Excel
    records = parse_excel()
    if not records:
        log('FALLO: No se encontraron registros')
        cleanup()
        sys.exit(1)

    # Paso 3: Generar JSON
    save_json(records)

    # Paso 4: Subir a GitHub (si no es --local)
    if not local_only:
        git_push()
    else:
        log('Modo local: no se sube a GitHub (usa sin --local para push)')

    # Limpieza
    cleanup()

    print()
    log('COMPLETADO')
    print(f'  Registros: {len(records)}')
    print(f'  Archivo:   {OUTPUT_JSON}')
    if not local_only:
        print(f'  GitHub:    https://uhernandez2497-source.github.io/dashboard-flota/')
    print()


if __name__ == '__main__':
    main()
