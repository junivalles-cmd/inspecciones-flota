# Sistema de Inspecciones de Flota — v3 (Etapa 1: backend)

CONEQUISA · Maquinaria Open Pit · Mina La Libertad (Volcán / Mojón)

## Uso (para el usuario final)

1. Abra `dist/index.html` con doble clic, o entre al link de GitHub Pages. Necesita **internet** (Google Chrome o Microsoft Edge).
2. Escriba su **usuario y contraseña** (se las da el administrador) y haga clic en **Entrar**.
3. Trabaje en las pestañas: **Tablero**, **Registrar inspección**, **Historial**, **Equipos**, **Configuración**.
   - **Equipos** y **Configuración** solo se pueden editar con una cuenta de rol `admin`; con `inspector` se ven pero sin los botones de guardar.
4. **Salir** (botón arriba a la derecha) cierra la sesión. La sesión se queda guardada en el navegador mientras no la cierre.

Los adjuntos (fotos/informes) están **deshabilitados por ahora** — pendientes de la Etapa 2 (integración con Google Drive). Ver `ESPECIFICACION.md` sección 9.

## Desarrollo

```bash
npm install          # instala Vite, vite-plugin-singlefile y Vitest
npm run dev           # servidor de desarrollo (http://localhost:5173)
npm test              # pruebas unitarias (Vitest)
npm run build:pages   # genera dist/index.html y lo copia a docs/index.html (GitHub Pages)
```

### Backend (Supabase)

- Esquema completo en `supabase/schema.sql` (tablas `perfiles`, `equipos`, `config`, `inspecciones`, con RLS de 2 roles: `admin`/`inspector`).
- La Project URL y la `anon/publishable key` están embebidas en `src/store/supabase.js` — son públicas por diseño, la seguridad real la da RLS.
- La `service_role`/`secret key` **nunca va en el código**; solo se usa puntual y manualmente (fuera del repo) para crear cuentas nuevas o correr migraciones de datos.
- Para crear una cuenta nueva: Auth Admin API (`POST /auth/v1/admin/users` con la secret key) + un `insert` en `perfiles` con su `usuario`/`nombre`/`rol`.

### Estructura del código

```
src/
  core/
    estado.js        → regla de estado (ESPECIFICACION.md 3.3) + controles por bandera del equipo, pura
    estado.test.js
    equipos.js        → identidad de equipos (id oculto, codigo/codigo2), pura
    equipos.test.js
    dominio.js        → constantes del dominio (flotas, controles, colores, banderas)
  store/
    supabase.js       → cliente mínimo (fetch directo, sin SDK): login, sesión, peticiones autenticadas
    datos.js           → CRUD de equipos/inspecciones/config contra Supabase
  ui/
    tablero.js, registrar.js, historial.js, equipos.js, config.js  → una pantalla por archivo
    dom.js, csv.js, excel.js, modal.js, navegacion.js, compartido.js, iconos.js → utilidades compartidas
  state.js            → estado de la app en memoria (equipos, inspecciones, config de la sesión)
  main.js             → arranque: login, carga de datos, conecta todas las piezas
index.html, styles.css
supabase/schema.sql   → esquema de la base de datos
datos_iniciales/      → histórico (v1/v2); ya no lo usa el código, los datos reales están en Supabase
referencia/            → v1 (HTML de un solo archivo), se usó como base de comportamiento
```

## Página publicada

`docs/index.html` es una copia de `dist/index.html` para GitHub Pages. Después de cada cambio, corre `npm run build:pages` y sube `dist/` y `docs/` junto con el código.

## Siguientes etapas (ver ESPECIFICACION.md sección 9)

- **Etapa 2:** integración con la API de Google Drive para adjuntos, y PWA instalable.
- **Etapa 3:** modo sin conexión real en campo (IndexedDB + motor de sincronización con manejo de conflictos, como `sync.js`/`db.js` de Control de Engrase) — la pieza más compleja, por eso va al final.
