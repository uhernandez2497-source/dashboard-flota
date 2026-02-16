/**
 * Vercel Serverless Function - Trigger GitHub Actions Workflow
 *
 * Esta función ejecuta el workflow de actualización de datos
 * cuando se hace clic en el botón "Actualizar" del dashboard.
 */

export default async function handler(req, res) {
  // CORS headers para permitir llamadas desde el dashboard
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER || 'uhernandez2497-source';
    const GITHUB_REPO = process.env.GITHUB_REPO || 'dashboard-flota';
    const WORKFLOW_FILE = 'actualizar-datos.yml';

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN no configurado en variables de entorno');
    }

    // Ejecutar el workflow usando la API de GitHub
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Dashboard-Flota'
        },
        body: JSON.stringify({
          ref: 'master' // o 'main' según tu rama principal
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorData}`);
    }

    // Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Actualización iniciada desde OneDrive',
      timestamp: new Date().toISOString(),
      note: 'Los datos se actualizarán en 30-60 segundos'
    });

  } catch (error) {
    console.error('Error al ejecutar workflow:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
