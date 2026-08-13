/**
 * Vercel Serverless Function - Descarga Excel de OneDrive, parsea y sube a GitHub
 *
 * Flujo: POST /api/trigger-update
 *   1. Descarga el Excel directamente desde OneDrive (Vercel corre en AWS, no bloqueado)
 *   2. Parsea las filas usando la librería xlsx
 *   3. Genera data.json y data.js en el mismo formato que actualizar_datos.py
 *   4. Hace commit a GitHub via API (sin clonar el repo)
 */

import * as XLSX from 'xlsx';

const ONEDRIVE_URL =
  'https://femcom-my.sharepoint.com/personal/carlosu_hernandez_mecanicatek_com/_layouts/15/download.aspx?share=IQD1veTLe2bTQIoFUNNe7y3yAUzwHQ-2YN3uHUdOc4vF8Fs';

const HEADER_MAP = {
  'Equipo': 'equipo',
  'Tipo Equipo': 'tipo_equipo',
  'Marca': 'marca',
  'Modelo': 'modelo',
  'Razon Reparacion': 'razon',
  'Fecha Terminacion': 'fecha_terminacion',
  'Fecha Ingreso': 'fecha_ingreso',
  'Precio Refaccion': 'refaccion',
  'Precio Mano Obra': 'mano_obra',
  'Precio Otros Talleres': 'otros',
  'Total': 'total',
  'Dias Real': 'dias_real',
  'Dias Atraso': 'dias_atraso',
  'Dias Promedio': 'dias_promedio',
  'Nodo': 'nodo',
  'Taller Orden': 'taller_orden',
  'Region': 'region',
  'Zona Cliente': 'zona_cliente',
  'Clasificacion De La Orden': 'clasificacion',
  'Tipo de Servicio': 'tipo_servicio',
  'Tiempo estandar': 'tiempo',
  'Familia': 'familia',
  'Grupo Mantenimiento': 'grupo',
  'Orden': 'orden',
  'Cliente': 'cliente',
  'Operador': 'operador',
  'Solicitante': 'solicitante',
  'Calificacion Atendido A Tiempo': 'atendido_a_tiempo',
  'Kms Acumulados': 'kms_acumulados',
  'Serie': 'serie',
};

const MES_ESPANOL = {
  1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
  5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
  9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre',
};

// ── Descarga el Excel desde OneDrive ──
async function downloadExcel() {
  const res = await fetch(ONEDRIVE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DashboardFlota/2.0)' },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`OneDrive HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  if (ab.byteLength < 1000) throw new Error(`Archivo muy pequeño (${ab.byteLength} bytes)`);
  return ab;
}

// ── Parsea el Excel y devuelve lista de registros ──
function parseExcel(ab) {
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const ws = wb.Sheets['bd'] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 2) throw new Error('Excel vacío o sin datos');

  // Detectar columnas por nombre de encabezado (igual que el script Python)
  const header = rows[0];
  const col = {};
  header.forEach((h, i) => {
    if (h != null) {
      const key = HEADER_MAP[String(h).trim()];
      if (key) col[key] = i;
    }
  });

  const required = ['equipo', 'fecha_terminacion', 'total'];
  const missing = required.filter(k => !(k in col));
  if (missing.length) throw new Error(`Columnas no encontradas: ${missing.join(', ')}`);

  const safeFloat = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const safeStr = v => v == null ? '' : String(v).trim();
  const get = (row, key) => col[key] !== undefined && col[key] < row.length ? row[col[key]] : null;

  const safeDate = v => {
    if (!v) return '';
    if (v instanceof Date) {
      const d = v.getDate().toString().padStart(2, '0');
      const m = (v.getMonth() + 1).toString().padStart(2, '0');
      return `${d}/${m}/${v.getFullYear()}`;
    }
    return String(v).trim();
  };

  const extractMesAno = row => {
    const fecha = get(row, 'fecha_terminacion');
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
      return { mes: MES_ESPANOL[fecha.getMonth() + 1] || '', ano: String(fecha.getFullYear()) };
    }
    if (fecha && typeof fecha === 'string') {
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return { mes: MES_ESPANOL[d.getMonth() + 1] || '', ano: String(d.getFullYear()) };
      }
    }
    return { mes: '', ano: '' };
  };

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const equipo = get(row, 'equipo');
    if (!equipo) continue;

    const { mes, ano } = extractMesAno(row);

    records.push({
      equipo: safeStr(equipo),
      orden: safeStr(get(row, 'orden')),
      tipo_equipo: safeStr(get(row, 'tipo_equipo')),
      marca: safeStr(get(row, 'marca')),
      modelo: safeStr(get(row, 'modelo')),
      serie: safeStr(get(row, 'serie')),
      razon_reparacion: safeStr(get(row, 'razon')),
      fecha_ingreso: safeDate(get(row, 'fecha_ingreso')),
      fecha_terminacion: safeDate(get(row, 'fecha_terminacion')),
      precio_refaccion: safeFloat(get(row, 'refaccion')),
      precio_mano_obra: safeFloat(get(row, 'mano_obra')),
      precio_otros: safeFloat(get(row, 'otros')),
      total: safeFloat(get(row, 'total')),
      dias_real: safeFloat(get(row, 'dias_real')),
      dias_atraso: safeFloat(get(row, 'dias_atraso')),
      dias_promedio: safeFloat(get(row, 'dias_promedio')),
      nodo: safeStr(get(row, 'nodo')),
      taller_orden: safeStr(get(row, 'taller_orden')),
      region: safeStr(get(row, 'region')),
      zona_cliente: safeStr(get(row, 'zona_cliente')),
      clasificacion: safeStr(get(row, 'clasificacion')),
      tipo_servicio: safeStr(get(row, 'tipo_servicio')),
      tiempo_estandar: safeFloat(get(row, 'tiempo')),
      familia: safeStr(get(row, 'familia')),
      mes,
      ano,
      grupo_manto: safeStr(get(row, 'grupo')),
      cliente: safeStr(get(row, 'cliente')),
      operador: safeStr(get(row, 'operador')),
      solicitante: safeStr(get(row, 'solicitante')),
      atendido_a_tiempo: safeStr(get(row, 'atendido_a_tiempo')),
      kms_acumulados: safeFloat(get(row, 'kms_acumulados')),
    });
  }

  return records;
}

const GH_HEADERS = token => ({
  'Accept': 'application/vnd.github.v3+json',
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'User-Agent': 'Dashboard-Flota',
});

// ── Hace commit de un archivo a GitHub, con auto-retry si hay conflicto de SHA ──
async function commitFile(repo, path, content, message, token) {
  for (let attempt = 0; attempt < 3; attempt++) {
    // Obtener SHA actual del archivo en cada intento (siempre fresco)
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: GH_HEADERS(token),
    });
    let sha = undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha || undefined;
    }

    const body = { message, content, branch: 'master' };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: GH_HEADERS(token),
      body: JSON.stringify(body),
    });

    if (putRes.ok) return; // éxito

    if (putRes.status === 409) {
      // Conflicto de SHA — reintentamos con SHA fresco
      continue;
    }

    const err = await putRes.text();
    throw new Error(`GitHub commit ${path}: ${putRes.status} - ${err}`);
  }

  throw new Error(`GitHub commit ${path}: demasiados conflictos de SHA`);
}

// ── Handler principal ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER || 'uhernandez2497-source';
  const GITHUB_REPO = process.env.GITHUB_REPO || 'dashboard-flota';
  const repo = `${GITHUB_OWNER}/${GITHUB_REPO}`;

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ success: false, error: 'GITHUB_TOKEN no configurado' });
  }

  try {
    // 1. Descargar Excel desde OneDrive
    const ab = await downloadExcel();

    // 2. Parsear Excel
    const records = parseExcel(ab);
    if (!records.length) throw new Error('Sin registros válidos en el Excel');

    // 3. Generar JSON
    const now = new Date();
    const updated = now.toISOString();
    const output = { updated, count: records.length, data: records };
    const jsonStr = JSON.stringify(output, null, 0);
    const jsStr = `window.__FLEET_DATA__=${jsonStr};`;

    const jsonB64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
    const jsB64 = Buffer.from(jsStr, 'utf-8').toString('base64');

    const ts = now.toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const message = `Actualizar datos: ${ts} (${records.length} registros)`;

    // 4. Commit data.json y data.js secuencialmente (evita conflictos de SHA)
    await commitFile(repo, 'data.json', jsonB64, message, GITHUB_TOKEN);
    await commitFile(repo, 'data.js', jsB64, message, GITHUB_TOKEN);

    return res.status(200).json({
      success: true,
      count: records.length,
      updated,
      message: `${records.length} registros actualizados desde OneDrive`,
    });

  } catch (error) {
    console.error('Error en trigger-update:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}
