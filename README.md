# Sistema de Inspecciones de Flota — v2

CONEQUISA · Maquinaria Open Pit · Mina La Libertad (Volcán / Mojón)

## Uso (para el usuario final)

1. Abra `dist/index.html` con doble clic. Se abre en su navegador (**debe ser Google Chrome o Microsoft Edge de escritorio**; no funciona en Firefox, Safari ni en el celular).
2. La primera vez, haga clic en **Elegir carpeta** y seleccione la carpeta de Google Drive compartida (por ejemplo `G:\Mi unidad\INSPECCIONES FLOTA`).
   - Si la carpeta está vacía, la app la prepara automáticamente con los equipos y el historial de inspecciones iniciales.
   - Las siguientes veces, use **Reconectar a «carpeta»** para no tener que elegirla de nuevo.
3. Trabaje en las pestañas: **Tablero**, **Registrar inspección**, **Historial**, **Equipos**, **Configuración**.
4. Todos los que abran la app sobre la misma carpeta de Drive ven la misma información (los cambios se reflejan al recargar o automáticamente cada 60 segundos).

No se necesita instalar nada ni tener internet para usar la app; solo para que Google Drive sincronice la carpeta compartida entre los usuarios.

## Desarrollo

```bash
npm install        # instala Vite, vite-plugin-singlefile y Vitest
npm run dev         # servidor de desarrollo (http://localhost:5173)
npm test            # pruebas unitarias (Vitest)
npm run build        # genera dist/index.html — el archivo único para entregar
```

### Estructura del código

```
src/
  core/
    estado.js        → regla de estado (ESPECIFICACION.md 3.3), pura, sin DOM ni almacenamiento
    estado.test.js    → pruebas unitarias (casos 2 a 5 de la sección 8)
    dominio.js        → constantes del dominio (flotas, carpetas, controles, colores)
  store/
    idb.js            → persistencia del handle de carpeta en IndexedDB
    fs.js             → File System Access API: conectar, leer/escribir JSON, guardar adjuntos
    seed.js           → datos_iniciales/*.json embebidos en el build
  ui/
    tablero.js, registrar.js, historial.js, equipos.js, config.js  → una pantalla por archivo
    dom.js, csv.js, modal.js, navegacion.js, compartido.js          → utilidades compartidas
  state.js            → estado de la app en memoria (equipos, inspecciones, config cargados)
  main.js             → arranque: conecta todas las piezas
index.html, styles.css
datos_iniciales/      → carga inicial (112 equipos, 150 inspecciones, config.json)
referencia/           → v1 (HTML de un solo archivo), se usó como base de comportamiento
```

`npm run build` usa **vite-plugin-singlefile** para empacar todo (JS, CSS y los JSON de `datos_iniciales/`) en un único `dist/index.html`, que sigue abriéndose con doble clic como la v1.

### Notas de la regla de estado

`config.json` acepta las claves nuevas (`frecuencia_dias` / `anticipacion_dias`) y también las de la v1 (`f` / `a`); `normalizarConfig()` en `src/core/estado.js` hace la conversión.

## Siguiente etapa (no implementada aún)

Las mejoras de la sección 9 de `ESPECIFICACION.md`, empezando por la versión móvil con backend, quedan pendientes para una próxima etapa. El código ya está modularizado (cálculo / almacenamiento / interfaz separados) para facilitar ese cambio: el módulo `core/` no depende de `store/` ni de `ui/`, así que una futura versión con backend puede reemplazar `store/fs.js` sin tocar la lógica de negocio.
