# Sistema de Inspecciones de Flota – Especificación para Claude Code

**Cliente:** CONEQUISA – Departamento de Maquinaria Open Pit, Mina La Libertad (Volcán / Mojón), Equinox Gold
**Dueño del producto:** Junior Valles, Ingeniero de Confiabilidad
**Versión de la especificación:** 3.2 (Etapa 2, revertida a carpeta local) – 06/11/2026
**Repositorio:** https://github.com/junivalles-cmd/inspecciones-flota
**Referencia funcional:** `referencia/Sistema_Inspecciones_Flota_v1.html`. Es la v1 ya funcionando, un HTML de un solo archivo; usarla como base de comportamiento.

## Historial de versiones

- **1.0 (04/11/2026):** especificación inicial, a partir de la v1 ya en uso.
- **2.0 (04/11/2026):** reescritura modular de la app (`core`/`store`/`ui` separados, con pruebas unitarias de la regla de estado); estructura de carpetas de `INSPECCIONES/` cambiada de "por flota" a "por tipo de inspección + mes" (sección 4); botón de exportar a Excel el programa semanal/mensual de inspecciones (sección 3.4.2); corrección del combo "Control" del formulario de registrar, que podía quedar sin opciones; eliminación de los campos Horómetro y N.º de hallazgos del formulario de registrar (sección 3.4.3 y 5); publicación en GitHub Pages.
- **2.1 (04/11/2026):** cada equipo tiene ahora un `id` interno oculto e inmutable, y dos códigos visibles y editables, `codigo` y `codigo2` (sección 3.4.5); las inspecciones se enlazan al equipo por ese `id` (no por el código), para que renombrar un código no pierda el historial calculado en el Tablero (sección 5).
- **2.2 (04/11/2026):** corregido el botón [Editar] de Equipos, que abría el formulario como si fuera "Agregar equipo" cuando la carpeta ya tenía `equipos.json`/`inspecciones.json` guardados con una versión anterior a la 2.1 (sin `id` ni `equipoId`). Ahora, al conectar una carpeta así, la app completa esos campos automáticamente la primera vez que carga (sección 4.1).
- **2.3 (04/11/2026):** se llenó `codigo2` en `datos_iniciales/equipos.json` para 47 de los 112 equipos, usando la columna "Ahorrativo" de `EQUIPOS MINA LL 2026.xlsx` (sección 6).
- **2.4 (04/11/2026):** tres controles nuevos — Rodajes, Baldes e Implementos (sección 3.2) — a partir del mecanismo de "banderas del equipo" (adelanto de la mejora sugerida en la sección 9.8). Se corrigieron de paso dos bugs que asumían que "todo lo que no es GENERAL es AFEX": el proveedor autocompletado y la carpeta de adjuntos de estos controles nuevos usaban "Jhon May"/`INSPECCIONES AFEX` por error; ahora usan el proveedor y la carpeta de la inspección general del equipo.
- **2.5 (04/11/2026):** el buscador de equipo (Registrar/Historial) mostraba cada equipo dos veces, una por código y otra por Ahorrativo — ahora es una sola entrada por equipo. Se renombró "Código 2" a **Ahorrativo** en toda la interfaz. Repaso visual con la skill `ui-ux-pro-max` (sin su generador de paletas, que requiere Python no disponible en esta máquina): se reemplazaron los emojis estructurales (📁 👤 📅 📎) por iconos SVG en línea (`src/ui/iconos.js`), se le dio sombra sutil a tarjetas/modales, estados de foco visibles, y una pastilla de color con punto indicador en cada estado (no depende solo del color). Los colores de la sección 3.3 no se tocaron: ya cumplían contraste WCAG AA (4.5:1 o más en todos los pares texto/fondo, verificado).
- **2.6 (05/11/2026):** con Python instalado, se corrió el generador de la skill `ui-ux-pro-max` (`--design-system`, dominios `ux`/`chart`/`typography`/`icons`) buscando específicamente "internal operations dashboard" (la primera búsqueda genérica devolvió un patrón de landing page de marketing, descartado por no aplicar). Confirmó que el rumbo tomado en la 2.5 ya encajaba con "Data-Dense Dashboard" + "Soft UI Evolution" (tarjetas redondeadas 10-12px con sombra suave, iconos de trazo/outline, color + texto en los estados) — no se cambió el estilo. Se agregaron las dos recomendaciones concretas que faltaban: pila de fuente del sistema completa (`-apple-system, ... Segoe UI, Roboto, ...`, sin Google Fonts, por el requisito de funcionar sin internet de la sección 10) y soporte para `prefers-reduced-motion`. El color institucional `#1E3A5F` de la sección 3.3 se mantuvo tal cual (es el color del cliente, no algo que la skill deba redefinir).
- **3.0 — Etapa 1 (05/11/2026): migración a backend.** Motivo: la v2 (File System Access API + carpeta de Drive) no podía resolver dos problemas de fondo — Chrome/Edge piden reconectar la carpeta en cada sesión del navegador (límite de seguridad, no un bug), y no había control del volumen de adjuntos. Se migró a Supabase (Postgres + Auth) para datos y autenticación, manteniendo el mismo stack vanilla JS + Vite; los adjuntos se quedan en Google Drive (vía su API, pendiente de implementar — ver sección 9). Cambios:
  - **Autenticación real** con usuario/contraseña (Supabase Auth), reemplaza "escribir el nombre" de la v1/v2. Dos roles: `admin` (Equipos y Configuración) e `inspector` (registrar y consultar). Patrón tomado de Control de Engrase: usuario corto convertido a email sintético (`usuario@inspecciones.internal`) para no pedir un correo real.
  - **equipos, inspecciones y config** ya no son archivos JSON en una carpeta — son tablas Postgres (`supabase/schema.sql`) con RLS: cualquier autenticado lee todo; solo `admin` escribe equipos/config; cualquier autenticado registra/edita inspecciones.
  - Los 113 equipos y 133 inspecciones de la carpeta de Drive que ya estaba en uso se migraron a Supabase (sección 6).
  - Los adjuntos quedaron pendientes de la Etapa 2 (ver 3.1 más abajo, ya hecha) — campo "Informe y fotos" deshabilitado en Registrar en esta Etapa 1.
  - La sección 10 ("sin dependencias de internet") ya **no aplica**: la app ahora necesita conexión para entrar y para leer/escribir datos. El modo sin conexión en campo es la Etapa 3, todavía no implementada.
  - Se retiraron `src/store/fs.js`, `src/store/idb.js` y `src/store/seed.js` (File System Access API) y las funciones de migración de la v2.1/2.2, ya innecesarias porque el esquema de Supabase siempre trae `id`/`equipo_id`.
- **3.1 — Etapa 2, primer intento (06/11/2026): adjuntos por la API de Google Drive — REVERTIDO, ver 3.2.** Se implementó `src/store/drive.js` (Google Identity Services + API de Drive v3 por `fetch` directo, scope completo `drive`, reconexión en silencio) y funcionó en el diseño, pero la configuración en Google Cloud (pantalla de consentimiento OAuth, declarar el scope en "Data Access", verificación/test users) resultó demasiado enredo para que Junior la terminara de configurar solo — dos vueltas de errores (`access_denied` por scope no declarado, "no ha completado la verificación" por test users) antes de decidir no seguir por ahí. Se quitó `drive.js` por completo.
- **3.2 — Etapa 2, carpeta local (06/11/2026):** en vez de la API de Drive, los adjuntos vuelven a una **carpeta local** elegida con `showDirectoryPicker` (File System Access API) — igual que la v1/v2, pero **solo para los archivos**; equipos/inspecciones/config siguen en Supabase sin cambios. `src/store/carpetaLocal.js`:
  - Cada quien que vaya a adjuntar archivos conecta la carpeta en su propia PC (botón "Elegir carpeta de adjuntos" / "Reconectar a «nombre»" en Registrar, mismo patrón que la pantalla de bienvenida de la v1/v2). Por ahora, en la práctica, **solo Junior la tiene conectada** en su PC — si alguien más registra una inspección con adjuntos sin tener la carpeta conectada en su propia máquina, no va a poder adjuntar nada ahí.
  - Mismo nombrado de archivo y misma ruta de siempre (`INSPECCIONES/<tipo o AFEX>/<AAAA-MM>/<código>/AAAA-MM-DD_TIPO_n.ext`, sufijo `_2`/`_3`… si ya existe) — `core/dominio.js` sigue usando `segmentosRutaAdjuntos(equipo, tipo, fecha)` (pura, con pruebas), ahora para armar la ruta de carpetas a crear/leer con `getDirectoryHandle` en vez de llamadas a una API.
  - `inspecciones.archivos` guarda `[{ nombre, ruta }]` (ruta relativa a la raíz de la carpeta elegida), no un link web — por eso en Historial esos adjuntos se abren con un botón que usa la carpeta conectada (`abrirArchivo`), no con un link `<a href>`; si la carpeta no está conectada en esa PC, avisa en vez de fallar en silencio.
  - Esto es exactamente la misma limitación que tenía la v2 original (pedir la carpeta, sin nada compartido entre navegadores) — pero ahora acotada solo a los adjuntos, no a toda la app; el problema de fondo que motivó la Etapa 1 (reconectar para TODO, equipos/inspecciones incluidos) ya quedó resuelto y no vuelve.

---

## 1. Objetivo

Programar y controlar las inspecciones periódicas de toda la flota y guardar cada inspección realizada, con su informe y sus fotos, en una carpeta compartida de Google Drive. Así el equipo sabe en todo momento:

- qué equipos están al día, cuáles toca programar y cuáles están vencidos;
- el historial completo de cada equipo, con acceso a los informes.

## 2. Usuarios

| Rol | Qué hace |
|---|---|
| Inspector (Emilio Díaz) | Registra inspecciones, sube informes y fotos |
| Ingeniero de Confiabilidad (Junior Valles) | Administra equipos y frecuencias, revisa el tablero |
| Planners / Jefes de Taller / Superintendente | Consultan el tablero y el historial |

**v1/v2:** sin login — el nombre de quien registra se guardaba en el navegador. **Desde la v3:** login real por usuario/contraseña (Supabase Auth); el nombre que se graba en cada inspección es el del perfil de la cuenta con la que se entró, no algo que se pueda escribir a mano.

## 3. Alcance funcional

### 3.1 Flotas y quién inspecciona

| Clave | Nombre en pantalla | Proveedor de la inspección general | Carpeta |
|---|---|---|---|
| `CAT` | NIMAC – Caterpillar | NIMAC | `CAT - NIMAC` |
| `KOMATSU` | Construmarket – Komatsu | Construmarket | `KOMATSU - CONSTRUMARKET` |
| `VOLQUETES` | Acarreo – Volquetes | (por definir; editable por equipo) | `VOLQUETES - ACARREO` |
| `AUXILIAR` | Flota auxiliar (camionetas, cisternas, lúbricos, generadores, motosoldadores, torres de iluminación) | Taller CONEQUISA | `FLOTA AUXILIAR` |

### 3.2 Controles (tipos de inspección)

| Clave | Nombre | Aplica a | Frecuencia | Aviso "PROGRAMAR" | Proveedor |
|---|---|---|---|---|---|
| `GENERAL` | Inspección general | Todos los equipos activos | 30 días | 10 días antes | el de la flota o equipo |
| `AFEX_INSP` | AFEX – Inspección | Equipos con `afex = true` | 30 días | 10 días antes | Jhon May |
| `AFEX_MANT` | AFEX – Mantenimiento | Equipos con `afex = true` | 90 días | 15 días antes | Jhon May |
| `AFEX_CERT` | AFEX – Recertificación | Equipos con `afex = true` | 365 días | 30 días antes | Jhon May |
| `RODAJES` | Inspección de rodajes | Equipos con `rodajes = true` (tractores y excavadoras de orugas) | 30 días | 10 días antes | el de la flota o equipo |
| `BALDES` | Inspección de baldes | Equipos con `baldes = true` (excavadoras) | 30 días | 10 días antes | el de la flota o equipo |
| `IMPLEMENTOS` | Inspección de implementos | Equipos con `implementos = true` (tractores) | 30 días | 10 días antes | el de la flota o equipo |

Frecuencia y aviso son **configurables** (ver `config.json`). Cada equipo genera 1 control (GENERAL) más uno por cada bandera que tenga activada (AFEX son 3 controles; Rodajes, Baldes e Implementos son 1 cada uno). A diferencia de AFEX, estos tres los hace el mismo proveedor/taller de la inspección general del equipo, no Jhon May, y sus adjuntos se guardan en la misma carpeta que la inspección general (sección 4), no en "INSPECCIONES AFEX".

Estos controles son los primeros en usar el mecanismo de "banderas del equipo" pensado en la sección 9.8: agregar uno nuevo así (ligado a una característica del equipo, no a la flota) implica un renglón en `BANDERAS_EQUIPO` (`core/dominio.js`) y otro en `CONTROLES_POR_BANDERA` (`core/estado.js`), más su nombre en `CONTROLES_NOMBRE` y su frecuencia por defecto en `CONFIG_DEFAULT` — el resto de las pantallas (tablero, filtros, CSV, Excel) ya es genérico por tipo de control.

### 3.3 Regla de estado (núcleo del sistema)

Para cada par (equipo, control):

```
ultima   = fecha más reciente de las inspecciones con ese codigo + tipo
si no hay ultima           → estado = "SIN REGISTRO", proxima = null, dias = null
proxima  = ultima + frecuencia_dias
dias     = proxima − hoy            (en días enteros; hoy a las 00:00 hora local)
si dias < 0                → "VENCIDA"
si dias <= anticipacion    → "PROGRAMAR"
si no                      → "AL DÍA"
```

- **Orden del tablero:** VENCIDA → PROGRAMAR → SIN REGISTRO → AL DÍA. Dentro de cada estado, por `dias` de menor a mayor y luego por código.
- **% al día de un grupo** = (AL DÍA + PROGRAMAR) ÷ total de controles del grupo.
- **Estado general de un equipo con AFEX** (para resúmenes) = el peor de sus 4 controles, con esta prioridad: VENCIDA > SIN REGISTRO > PROGRAMAR > AL DÍA.
- Los equipos con `activo = false` no generan controles, pero su historial se conserva.

Colores (tonos suaves):

| Estado | Fondo | Texto | Color en gráficos |
|---|---|---|---|
| AL DÍA | `#E3F4E8` | `#1E7B34` | `#2E9E4F` |
| PROGRAMAR | `#FFF3D6` | `#8A5A00` | `#E8A317` |
| VENCIDA | `#FDE4E4` | `#B42318` | `#D14343` |
| SIN REGISTRO | `#EEF0F3` | `#5B6472` | `#A3AAB5` |

Color institucional: azul `#1E3A5F`. Fuente: Segoe UI / Arial.

### 3.4 Pantallas

1. **Entrar al sistema (v3)** — reemplaza la pantalla "Conectar carpeta" de la v1/v2.
   - Usuario y contraseña (Supabase Auth); botón "Salir" en el encabezado para cerrar sesión.
   - La sesión se guarda en el navegador (`localStorage`) y se renueva sola mientras el refresh token siga vigente — no hay que volver a escribir la contraseña cada vez que se abre la pestaña, a diferencia de la carpeta de la v1/v2.
2. **Tablero**
   - 5 tarjetas: una por flota (solo control GENERAL) y una de AFEX (los 3 controles AFEX). Cada tarjeta muestra % al día, total de controles, barra apilada por estado y leyenda con los conteos.
   - Tabla de controles con: Código, Ahorrativo, Descripción, Modelo, Ubicación, Control, Proveedor, Última, Próxima, Días, Estado (pastilla de color) y las acciones [Registrar] e [Historial].
   - Filtros: texto (busca en código, Ahorrativo, modelo y descripción), flota (incluye la opción "AFEX"), control, estado y ubicación.
   - Exportar a CSV lo que esté filtrado (separador `;`, UTF-8 con BOM para que Excel lo abra bien).
   - Botón **"Programa semanal/mensual (Excel)"**: genera un `.xlsx` con diseño (encabezado institucional, pastillas de color por estado) con dos hojas, *Semana* y *Mes*, con los equipos a inspeccionar en los próximos 7 y 30 días respectivamente (ventana móvil desde hoy, no semana/mes calendario). Siempre incluye VENCIDA y SIN REGISTRO en ambas hojas, sin importar el horizonte.
3. **Registrar inspección**
   - Equipo (autocompletar por código o por Ahorrativo; debajo muestra descripción, modelo, flota, ubicación y el Ahorrativo si tiene). En el buscador cada equipo aparece una sola vez, aunque tenga los dos códigos.
   - Control (solo los que aplican al equipo; **siempre tiene al menos la opción "Inspección general" cargada desde que se abre la pantalla**, aunque todavía no se haya escrito ningún código de equipo — en la v1 este combo podía quedar vacío si se entraba a la pestaña sin pasar por el botón [Registrar] del tablero).
   - Fecha (por defecto hoy; no se permiten fechas futuras).
   - Proveedor (se autocompleta: el del equipo, o Jhon May si es AFEX).
   - Inspector / técnico, Resultado (Sin hallazgos / Con hallazgos / Equipo fuera de servicio) y Observaciones.
   - Adjuntos múltiples (PDF, imágenes, Excel, Word), a una carpeta local (sección 3.2 del historial) — botón **"Elegir carpeta de adjuntos"** / **"Reconectar a «nombre»"**, igual que la pantalla de bienvenida de la v1/v2. Por ahora, en la práctica, solo quien tenga la carpeta de Drive sincronizada y conectada en su propia PC puede adjuntar.
   - El botón [Registrar] del tablero abre esta pantalla con equipo, control y fecha ya llenos.
   - **Quitados en la v2:** los campos Horómetro y N.º de hallazgos (no se piden al registrar; ver sección 5 sobre el historial de registros antiguos que sí los tienen).
4. **Historial**
   - Lista de inspecciones, la más reciente primero.
   - Filtros: equipo, control, rango de fechas.
   - Columna de adjuntos: los de registros nuevos (Etapa 2) abren en pestaña nueva; los de inspecciones migradas de la v2 solo se muestran como referencia (siguen donde estaban, sección 4.2).
   - Permite eliminar un registro, con confirmación.
   - Exportar a CSV.
5. **Equipos**
   - Lista con búsqueda; agregar y editar (**solo admin** — a `inspector` no le aparecen esos botones).
   - Cada equipo tiene un **id interno** (p. ej. `E001`), autogenerado al crearlo, **oculto** (no aparece en ninguna pantalla ni se puede editar) y que nunca cambia — es el que usa el sistema para enlazar el equipo con su historial de inspecciones.
   - Campos visibles y editables: **código** y **Ahorrativo** (campo `codigo2` — dos identificadores, p. ej. `45-69` y `T-01`; ninguno de los dos es obligatorio salvo el código principal, y ambos deben ser únicos entre todos los equipos), descripción, modelo, ubicación (Volcán, Mojón, Acarreo, Troja, Taller), flota, proveedor, activo, y una bandera Sí/No por cada control adicional: **AFEX**, **Rodajes**, **Baldes**, **Implementos** (sección 3.2).
   - A diferencia de la v1, el código **ya no es inmutable**: se puede renombrar en cualquier momento sin perder el historial ni el estado calculado, porque el enlace real es por el id oculto (ver sección 5).
6. **Configuración**
   - Frecuencia y anticipación de cada control (**solo admin** edita; `inspector` la ve deshabilitada).
   - Botón "Recargar datos" (vuelve a leer equipos/inspecciones/config de Supabase).

## 4. Almacenamiento (v3 — Supabase)

**Backend propio en Supabase** (proyecto `inspecciones-flota`, Postgres + Auth), esquema completo en `supabase/schema.sql`. Reemplaza la carpeta de Drive + File System Access API de la v1/v2 (sección 4.2) para `equipos`, `inspecciones` y `config` — ver el motivo en el historial de versiones (3.0).

- **Tablas:** `perfiles`, `equipos`, `config`, `inspecciones` (detalle de columnas en la sección 5). `equipos.id` sigue siendo el formato `E001`, `E002`… (sección 3.4.5) para que la migración de datos fuera directa.
- **RLS (seguridad por fila):** cualquier usuario autenticado puede leer las 4 tablas. Solo `rol = 'admin'` puede escribir en `equipos`/`config`. Cualquier autenticado puede crear/editar/borrar en `inspecciones`. Función auxiliar `es_admin()` en el esquema.
- **Credenciales en el cliente:** la Project URL y la **anon/publishable key** están embebidas en `src/store/supabase.js` — son públicas por diseño (la seguridad real es la RLS de arriba), igual que en Control de Engrase. La **secret/service_role key** nunca va en el código; solo se usó, puntual y manualmente, para crear las cuentas iniciales y migrar los datos (sección 6).
- **Adjuntos (fotos/informes):** no están en Supabase Storage (así no se genera costo de almacenamiento nuevo) ni en esta base de datos — desde la Etapa 2 (sección 3.2) viven en una carpeta local conectada por `showDirectoryPicker` (`src/store/carpetaLocal.js`), la misma carpeta de Drive para escritorio de siempre; `inspecciones.archivos` solo guarda el nombre y la ruta relativa.
- **Concurrencia:** ya no aplica el patrón "releer antes de escribir" de la v1/v2 — Postgres lo resuelve solo (cada escritura es una transacción).

### 4.1 Distribución de la app (v3)

- `dist/index.html` / `docs/index.html`: igual que la v2 — build de un solo archivo (`npm run build:pages`), publicado en GitHub Pages (`https://junivalles-cmd.github.io/inspecciones-flota/`). Sigue siendo un solo HTML, pero **ya no funciona sin internet** (sección 10): necesita llegar a Supabase para entrar y para leer/escribir datos.
- El repositorio es público (igual que antes) — ahora eso expone el código, no datos (los datos reales viven en Supabase, protegidos por RLS, no en el repositorio).

### 4.2 Almacenamiento v1/v2 (histórico — ya no es el mecanismo activo)

Carpeta local sincronizada con Google Drive para escritorio + File System Access API (`showDirectoryPicker`). Se mantiene esta sección porque los adjuntos de inspecciones registradas antes de la Etapa 2 siguen físicamente en esas rutas (los `archivos` migrados a Supabase son los nombres/rutas tal como quedaron, sin mover ningún archivo):

```
<CARPETA RAÍZ>/
  _SISTEMA/ (ya no se usa en v3 — los datos están en Supabase)
  INSPECCIONES/
    INSPECCIONES NIMAC/<AAAA-MM>/<codigo>/AAAA-MM-DD_<TIPO>_<n>.<ext>
    INSPECCIONES CONSTRUMARKET/<AAAA-MM>/<codigo>/...
    INSPECCIONES AFEX/<AAAA-MM>/<codigo>/...
    INSPECCIONES TALLER CONEQUISA/<AAAA-MM>/<codigo>/...
    INSPECCIONES VOLQUETES/<AAAA-MM>/<codigo>/...        (solo si el equipo no tiene proveedor asignado)
```

- La carpeta de primer nivel dentro de `INSPECCIONES/` se elegía por **tipo de inspección** (quién inspecciona), no por flota: `INSPECCIONES <PROVEEDOR>` para el control GENERAL, y siempre `INSPECCIONES AFEX` para los tres controles AFEX.
- **Nombre de los adjuntos:** `AAAA-MM-DD_TIPO_n.ext`, por ejemplo `2026-11-04_GENERAL_1.pdf`.
- Esta carpeta sigue siendo donde vive físicamente todo lo adjuntado, de antes y de ahora: desde la Etapa 2 (3.2 del historial), los adjuntos nuevos siguen yendo a la misma estructura, otra vez por `showDirectoryPicker` — pero ahora conectado solo para esto, no para toda la app.

## 5. Modelo de datos

Desde la v3 (Etapa 1) estas son tablas Postgres en Supabase (`supabase/schema.sql`), no archivos JSON — se muestran aquí en formato JSON porque es como viaja cada fila por la API (PostgREST) y es como las usa el resto de esta especificación.

### tabla `equipos`
```json
{
  "id": "E001",               // interno, oculto, autogenerado, inmutable — NO se muestra en la interfaz
  "codigo": "518",            // visible, editable, único (ej. "05-0763", "20-0016", "T2", "E2")
  "codigo2": "",              // visible, editable, único si no está vacío (segundo identificador, ej. "A02")
  "descripcion": "Tractor de orugas",
  "modelo": "D9R",
  "ubicacion": "Volcán",      // Volcán | Mojón | Acarreo | Troja | Taller | ""
  "flota": "CAT",             // CAT | KOMATSU | VOLQUETES | AUXILIAR
  "proveedor": "NIMAC",       // proveedor de la inspección general (y de Rodajes/Baldes/Implementos)
  "afex": true,               // tiene sistema de supresión AFEX → agrega AFEX_INSP/AFEX_MANT/AFEX_CERT
  "rodajes": true,            // tractor o excavadora de orugas → agrega el control RODAJES
  "implementos": true,        // tractor de orugas → agrega el control IMPLEMENTOS
  "baldes": false,            // excavadora → agrega el control BALDES
  "activo": true
}
```
- `afex`, `rodajes`, `baldes` e `implementos` son independientes entre sí; un equipo puede tener cualquier combinación (p. ej. una excavadora con AFEX, Rodajes y Baldes, pero no Implementos). Si un equipo no tiene ninguna, solo genera el control GENERAL.
- El `id` se genera como `E` + número secuencial de 3 dígitos (`E001`, `E002`, …, `E112`, `E113`…), calculado a partir del id más alto que ya exista. Nunca se reutiliza ni se recicla, y no tiene ninguna relación con el orden o el valor de `codigo`/`codigo2`.
- `codigo` y `codigo2` se pueden editar libremente desde la pantalla Equipos (sección 3.4.5); el enlace con el historial de inspecciones es por `id`, no por estos campos, así que renombrarlos no afecta el estado calculado en el Tablero.

### tabla `inspecciones`
```json
{
  "id": "lq3k9x2a",           // único
  "equipoId": "E001",         // columna equipo_id en Postgres; enlace real con equipos (por id, no por código)
  "codigo": "518",            // código del equipo al momento de registrar (para mostrar en Historial aunque después se renombre)
  "tipo": "GENERAL",          // GENERAL | AFEX_INSP | AFEX_MANT | AFEX_CERT
  "fecha": "2026-11-04",      // ISO, fecha de la inspección (no del registro)
  "proveedor": "NIMAC",
  "inspector": "Emilio Díaz",
  "resultado": "Sin hallazgos",
  "obs": "texto",
  "archivos": [{"nombre": "2026-11-04_GENERAL_1.pdf", "ruta": "INSPECCIONES/INSPECCIONES NIMAC/2026-11/518/2026-11-04_GENERAL_1.pdf"}],  // ruta relativa a la carpeta local conectada (sección 3.2)
  "creado": "2026-11-04T16:20:00.000Z",
  "usuario": "Junior Valles"
}
```
- `horometro` y `hallazgos`: campos de la v1, ya no se piden en el formulario de registrar (sección 3.4.3). Los registros antiguos que los tengan se siguen mostrando igual en Historial; los nuevos registros simplemente no los incluyen.
- `equipoId` es obligatorio para que el cálculo de estado (sección 3.3) funcione; si un registro no tiene `equipoId` (por ejemplo, viniera de una versión anterior), ese registro no cuenta para el estado del equipo hasta que se corrija.

### tabla `config`
Una fila por tipo de control: `{ "tipo": "GENERAL", "frecuencia_dias": 30, "anticipacion_dias": 10 }`, una por cada clave de la sección 3.2. El cliente (`src/store/datos.js`) la arma como objeto `{GENERAL: {...}, ...}` para que `core/estado.js` no tenga que cambiar.
(En la v1 de referencia las claves eran `f` y `a`; `core/estado.js` sigue aceptando ambas al leer, por si algún día se vuelve a importar algo con ese formato.)

### tabla `perfiles` (nueva en v3)
```json
{
  "id": "uuid de auth.users",
  "usuario": "junior",        // lo que la persona escribe para entrar
  "nombre": "Junior Valles",  // para mostrar y para el campo "usuario" de cada inspección
  "rol": "admin"              // admin | inspector
}
```

## 6. Datos iniciales (`datos_iniciales/`) y migración a Supabase

Esta sección describe los datos de la v1/v2. En la v3 (Etapa 1), los 113 equipos y 133 inspecciones que ya estaban en la carpeta de Drive conectada del usuario (no los 112/150 originales de `datos_iniciales/` — ya habían crecido con uso real) se migraron a Supabase con un script puntual (leyó los JSON, insertó por API con la `service_role key`). `datos_iniciales/` queda como referencia histórica — ya no lo usa el código (no hay "carpeta vacía" que inicializar).

- **equipos.json:** 112 equipos. CAT 41, KOMATSU 23, VOLQUETES 19, AUXILIAR 29. 52 tienen AFEX.
  - Fuentes: *FORMATO DE INSPECCIONES.xlsx* (hojas Inspecciones e Inspeccion AFEX) y el maestro *EQUIPOS MINA LL 2026.xlsx*.
  - Se excluyó el 45-26 (ya no está en la flota). El 05-0763 se incluyó.
- **inspecciones.json:** 150 registros de carga inicial: 9 GENERAL y 47 de cada control AFEX. Fechas de junio y julio de 2026, por eso casi todo aparece VENCIDO o SIN REGISTRO; es correcto.
- **config.json:** frecuencias por defecto.
- **Códigos normalizados:** 2091→20-91, 2096→20-96, 20102→20-102, 20107→20-107.
- **id:** los 112 equipos trajeron su `id` asignado en orden de aparición en el archivo (`E001`…`E112`); cada inspección de carga inicial trae el `equipoId` correspondiente.
- **codigo2:** se llenó para 47 de los 112 equipos con la columna "Ahorrativo" de `EQUIPOS MINA LL 2026.xlsx` (hoja "Datos"), cruzando por código normalizado. Los 65 restantes quedaron con `codigo2` vacío porque el maestro no tenía valor en esa columna para ellos, o porque esa columna traía un nombre de ubicación en vez de un código (4 camionetas: 80168, 80173, P174, P210) — eso se descartó. El equipo 05-0763 no aparece en ese maestro (según la sección 6, se incluyó aparte), así que tampoco tiene `codigo2` de ahí.
- **rodajes / baldes / implementos:** se marcaron por descripción: `rodajes = true` e `implementos = true` en los 10 equipos con descripción "Tractor de orugas"; `rodajes = true` y `baldes = true` en los 15 con "Excavadora de orugas". El resto de la flota (camiones, volquetes, motoniveladoras, auxiliares, etc.) queda sin estas banderas hasta que alguien las active desde Equipos.

## 7. Validaciones

- Equipo existente y activo, control válido para el equipo, fecha obligatoria y no futura.
- Usuario y contraseña obligatorios para entrar (v3); sin sesión válida, la RLS de Supabase rechaza cualquier lectura/escritura.
- `codigo` y `codigo2` deben ser únicos entre todos los equipos (sin distinguir mayúsculas), tanto al crear como al editar; no se permite que el `codigo2` de uno choque con el `codigo` de otro. Se valida en el cliente contra lo que ya está cargado; la tabla también tiene restricciones `unique` como respaldo.
- Solo `rol = 'admin'` puede crear/editar equipos y guardar configuración — la pantalla ya oculta esos botones a quien no sea admin, y la RLS lo bloquea aunque alguien intente saltarse la interfaz.
- Mensajes de éxito y error visibles; los errores no se ocultan solos.

## 8. Casos de prueba (aceptación)

1. ~~Carpeta vacía → al conectar se crean `_SISTEMA/*.json`~~ — ya no aplica (v3): la migración a Supabase fue un paso único, no algo que la app repita al conectar.
2. Equipo 518 sin inspección general previa. Registrar GENERAL con fecha de hoy → estado AL DÍA, próxima = hoy + 30, días = 30.
3. Inspección con fecha de hace 25 días (frecuencia 30, aviso 10) → días = 5 → PROGRAMAR.
4. Inspección con fecha de hace 31 días → días = −1 → VENCIDA.
5. 45-80, con última inspección general el 29/08/2025 → VENCIDA, con más de 400 días de atraso.
6. Registrar con 2 adjuntos (con la carpeta de adjuntos conectada) → quedan `INSPECCIONES/<tipo>/<AAAA-MM>/<código>/AAAA-MM-DD_GENERAL_1.<ext>` y `_2.<ext>`, y el registro guarda `{nombre, ruta}` de cada uno.
7. Registrar 2 veces el mismo día y tipo con adjuntos → no se sobrescriben (sufijo `_2`), igual que en la v1/v2.
8. Dos personas registran casi a la vez → Postgres ya resuelve esto (cada INSERT es independiente), no hace falta el patrón de releer-antes-de-escribir de la v1/v2.
9. Cambiar AFEX_MANT a 60 días → los estados se recalculan al guardar (solo admin puede hacerlo).
10. Dar de baja un equipo → desaparece del tablero y su historial sigue visible.
11. Exportar CSV → abre en Excel con tildes correctas y columnas separadas.
12. **(v3)** Entrar con usuario/contraseña correctos → ve el Tablero con datos reales. Cerrar sesión (botón "Salir") y volver a entrar sin recargar la página → pide usuario/contraseña otra vez, no la carpeta.
13. **(v3)** Entrar con la cuenta `emilio` (rol inspector) → puede registrar/ver, pero no ve el botón "+ Agregar equipo" ni "Guardar configuración".

## 9. Mejoras sugeridas / siguientes etapas (priorizar con Junior)

1. ~~**Uso desde el celular en campo:** pasar a PWA con backend~~ — **en marcha (v3).** Etapa 1: backend Supabase + login real, hecho. Etapa 2: adjuntos — se intentó por la API de Drive y se revirtió a carpeta local por lo enredado de configurar Google Cloud (sección 3.1/3.2) — **falta todavía la parte de PWA instalable** (`manifest.json` + Service Worker) de esta misma etapa; además la carpeta local no funciona desde celular, así que ese punto de la mejora sigue sin resolverse del todo. **Etapa 3:** modo sin conexión real en campo (IndexedDB + motor de sincronización con manejo de conflictos, como `sync.js`/`db.js` de Control de Engrase) — es la pieza más compleja, se deja para el final a propósito.
2. Captura de fotos directa con la cámara del teléfono y compresión de imágenes — con la subida a Drive ya lista, esto ya se puede hacer; falta implementarlo.
3. ~~Login simple por usuario y rol~~ — **hecho en la v3** (Etapa 1): Supabase Auth, roles `admin`/`inspector`.
4. Correo o notificación semanal con las inspecciones VENCIDAS y por PROGRAMAR.
5. Calendario mensual de inspecciones programadas por proveedor.
6. Registro de hallazgos individuales con estado (abierto / cerrado) y su enlace al backlog.
7. Importar y exportar equipos desde Excel.
8. ~~Más controles configurables (ej. inspección de baldes, GET de tractores)~~ — **hecho parcialmente en la v2.4** con Rodajes/Baldes/Implementos (sección 3.2), pero vía código (un renglón en `BANDERAS_EQUIPO`/`CONTROLES_POR_BANDERA`), no desde una pantalla. Queda pendiente la tabla `tipos_control` editable sin tocar código, si hace falta agregar controles con más frecuencia que lo que toma un cambio chico de código.

## 10. Restricciones y notas

- Idioma de la interfaz: español (Nicaragua). Fechas en `dd/mm/aaaa`; en los datos, ISO `aaaa-mm-dd`.
- Zona horaria: America/Managua (UTC−6).
- ~~Sin dependencias de internet~~ — **ya no aplica desde la v3.** La app necesita conexión para entrar (Supabase Auth) y para leer/escribir datos. El modo sin conexión en campo es la Etapa 3 de la sección 9, todavía no implementada.
- No borrar archivos adjuntos desde la app; solo registros.
