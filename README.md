# Dashboard Ejecutivo - Mantenimiento de Flota

Dashboard web para visualizar y analizar datos de mantenimiento de vehículos, con actualización automática de datos mediante GitHub Actions.

## 🚀 Características

- **📊 Visualizaciones interactivas**: KPIs, gráficos de tendencias, análisis Pareto 80/20
- **🔄 Actualización automática**: GitHub Actions descarga datos de OneDrive diariamente
- **📱 Responsive**: Funciona en desktop, tablet y móvil
- **📄 Reportes PDF**: Generación instantánea de reportes ejecutivos
- **🎯 Filtros dinámicos**: Por año, mes, tipo de equipo y clasificación

## 📁 Estructura del Proyecto

```
dashboard-flota/
├── .github/
│   └── workflows/
│       └── actualizar-datos.yml    # Workflow de GitHub Actions
├── index.html                       # Dashboard principal
├── actualizar_datos.py              # Script de actualización
├── data.json                        # Datos del dashboard (auto-generado)
└── README.md                        # Esta documentación
```

## 🔄 Sistema de Actualización Automática

### GitHub Actions Workflow

El archivo `.github/workflows/actualizar-datos.yml` configura un proceso automático que:

1. **Se ejecuta diariamente** a las 6:00 AM UTC (12:00 PM hora México)
2. **Descarga** el Excel desde OneDrive
3. **Convierte** los datos a formato JSON
4. **Actualiza** el archivo `data.json`
5. **Publica** automáticamente en GitHub Pages

### Ejecución Manual

También puedes ejecutar el workflow manualmente:

1. Ve a tu repositorio en GitHub
2. Click en la pestaña **Actions**
3. Selecciona **"Actualizar Datos del Dashboard"**
4. Click en **"Run workflow"**
5. Espera unos segundos a que termine

### Actualización Local (Opcional)

Si prefieres actualizar los datos desde tu computadora:

```bash
# Instalar dependencias
pip install openpyxl

# Ejecutar script (actualiza y sube a GitHub)
python actualizar_datos.py

# Solo actualizar local (sin subir a GitHub)
python actualizar_datos.py --local
```

## 🛠️ Configuración Inicial

### 1. Habilitar GitHub Pages

1. Ve a **Settings** → **Pages**
2. En "Source", selecciona la rama principal (`main` o `master`)
3. Guarda los cambios
4. Tu dashboard estará en: `https://[tu-usuario].github.io/dashboard-flota/`

### 2. Verificar Permisos de GitHub Actions

1. Ve a **Settings** → **Actions** → **General**
2. En "Workflow permissions", asegúrate de tener seleccionado:
   - ✅ **Read and write permissions**
3. Guarda los cambios

### 3. Verificar la URL de OneDrive

En `actualizar_datos.py` línea 24, verifica que la URL de OneDrive sea correcta:

```python
ONEDRIVE_URL = 'https://proxylogis-my.sharepoint.com/...'
```

## 📊 Estructura de Datos

El archivo `data.json` contiene:

```json
{
  "updated": "2025-02-16T12:00:00",
  "count": 1234,
  "data": [
    {
      "equipo": "VH-001",
      "tipo_equipo": "Camión",
      "total": 15000.50,
      "tiempo_estandar": 8.5,
      "clasificacion": "Preventivo",
      ...
    }
  ]
}
```

## 🔧 Solución de Problemas

### El workflow falla al ejecutarse

1. Verifica que los permisos de GitHub Actions estén habilitados
2. Revisa los logs en la pestaña **Actions**
3. Asegúrate de que la URL de OneDrive sea accesible

### El dashboard muestra "No hay datos"

1. Verifica que `data.json` existe en el repositorio
2. Ejecuta el workflow manualmente
3. Revisa que el archivo tenga contenido válido

### Los datos no se actualizan

1. Verifica que el workflow esté activo en **Actions**
2. Revisa el horario del cron en `actualizar-datos.yml`
3. Ejecuta manualmente para probar

## 📅 Programación del Workflow

Para cambiar la frecuencia de actualización, edita el cron en `.github/workflows/actualizar-datos.yml`:

```yaml
schedule:
  # Formato: minuto hora día mes día-semana
  - cron: '0 6 * * *'   # Diario a las 6:00 AM UTC

# Ejemplos:
# - cron: '0 */6 * * *'   # Cada 6 horas
# - cron: '0 6 * * 1'     # Cada lunes a las 6:00 AM
# - cron: '0 6 1 * *'     # Primer día de cada mes
```

## 🌐 Acceso al Dashboard

Una vez configurado, accede a tu dashboard en:

```
https://uhernandez2497-source.github.io/dashboard-flota/
```

## 📧 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, abre un issue en el repositorio de GitHub.

---

**Última actualización**: 2025-02-16
**Versión**: 2.0 (con GitHub Actions)
