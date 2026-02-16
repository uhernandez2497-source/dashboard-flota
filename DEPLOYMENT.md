# 🚀 Deployment en Vercel - Instrucciones

Este documento explica cómo configurar el backend serverless para que el botón "Actualizar" descargue datos directamente de OneDrive.

## 📋 Requisitos previos

- Cuenta en Vercel (gratis): https://vercel.com
- Cuenta de GitHub (ya la tienes)
- Personal Access Token de GitHub

---

## 🔑 Paso 1: Crear GitHub Personal Access Token

1. Ve a: https://github.com/settings/tokens
2. Click en **"Generate new token"** → **"Generate new token (classic)"**
3. Configuración del token:
   - **Note**: `Dashboard Flota - Vercel API`
   - **Expiration**: `No expiration` (o 1 año)
   - **Scopes** (permisos):
     - ✅ **repo** (acceso completo al repositorio)
     - ✅ **workflow** (ejecutar workflows)

4. Click en **"Generate token"**
5. **¡IMPORTANTE!** Copia el token y guárdalo (solo se muestra una vez)
   - Ejemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 🌐 Paso 2: Deploy en Vercel

### Opción A: Desde GitHub (Recomendado)

1. Ve a: https://vercel.com/new

2. Click en **"Import Git Repository"**

3. Selecciona tu repositorio: **uhernandez2497-source/dashboard-flota**

4. En "Configure Project":
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (dejar por defecto)
   - **Build Command**: (dejar vacío)
   - **Output Directory**: (dejar vacío)

5. Click en **"Environment Variables"** y agrega:

   | Name | Value |
   |------|-------|
   | `GITHUB_TOKEN` | `ghp_xxxx...` (el token que creaste) |
   | `GITHUB_OWNER` | `uhernandez2497-source` |
   | `GITHUB_REPO` | `dashboard-flota` |

6. Click en **"Deploy"**

7. Espera 1-2 minutos

8. Una vez desplegado, verás la URL: `https://dashboard-flota.vercel.app`

---

### Opción B: Desde CLI (Alternativa)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel

# Configurar variables de entorno
vercel env add GITHUB_TOKEN
vercel env add GITHUB_OWNER
vercel env add GITHUB_REPO

# Deploy a producción
vercel --prod
```

---

## ⚙️ Paso 3: Actualizar el Dashboard

Después del deployment, Vercel te dará una URL, por ejemplo:
```
https://dashboard-flota.vercel.app
```

Necesitas actualizar esta URL en el archivo `index.html`:

```javascript
// Buscar esta línea:
const API_URL = 'https://dashboard-flota.vercel.app/api/trigger-update';

// Y reemplazar con tu URL real de Vercel
```

---

## ✅ Paso 4: Verificar que Funciona

1. Ve a tu dashboard: `https://uhernandez2497-source.github.io/dashboard-flota/`

2. Abre la consola del navegador (F12)

3. Click en el botón **"Actualizar"**

4. Deberías ver:
   - ✅ Mensaje: "Solicitando actualización desde OneDrive..."
   - ✅ Espera de 45 segundos
   - ✅ Mensaje: "Datos actualizados desde OneDrive exitosamente"

5. Verifica en GitHub:
   - Ve a: `https://github.com/uhernandez2497-source/dashboard-flota/actions`
   - Deberías ver una nueva ejecución del workflow

---

## 🔧 Troubleshooting

### Error: "GITHUB_TOKEN no configurado"
- Verifica que agregaste las variables de entorno en Vercel
- Ve a: Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

### Error: "GitHub API error: 404"
- Verifica que `GITHUB_OWNER` y `GITHUB_REPO` sean correctos
- Verifica que el token tenga permisos de `workflow`

### Error: "CORS"
- Verifica que el archivo `vercel.json` esté en el repositorio
- Redeploy en Vercel

### El botón no hace nada
- Abre la consola del navegador (F12) y busca errores
- Verifica que la URL del API sea correcta en `index.html`

---

## 📊 Diagrama de Flujo

```
Usuario → Click "Actualizar"
    ↓
Dashboard → POST a Vercel API
    ↓
Vercel Function → Ejecuta GitHub Workflow
    ↓
GitHub Actions → Descarga de OneDrive
    ↓
GitHub Actions → Actualiza data.json
    ↓
Dashboard → Espera 45s → Recarga data.json
    ↓
Usuario → Ve datos actualizados
```

---

## 💰 Costos

- **Vercel**: Gratis (100GB bandwidth, 100 ejecuciones/día)
- **GitHub Actions**: Gratis (2000 minutos/mes para repos públicos)

---

## 🔒 Seguridad

- ✅ El token NO se expone en el navegador
- ✅ El token está en variables de entorno de Vercel
- ✅ La función serverless valida las peticiones
- ✅ CORS configurado correctamente

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel: Dashboard → Functions → Logs
2. Revisa los logs en GitHub Actions
3. Abre un issue en el repositorio

---

**¡Listo! Ahora el botón "Actualizar" descarga datos frescos de OneDrive con un solo clic.** 🎉
