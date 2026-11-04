# Sistema de Inspecciones de Flota – Especificación para Claude Code

**Cliente:** CONEQUISA – Departamento de Maquinaria Open Pit, Mina La Libertad (Volcán / Mojón), Equinox Gold
**Dueño del producto:** Junior Valles, Ingeniero de Confiabilidad
**Versión de la especificación:** 2.0 – 04/11/2026
**Repositorio:** https://github.com/junivalles-cmd/inspecciones-flota
**Referencia funcional:** `referencia/Sistema_Inspecciones_Flota_v1.html`. Es la v1 ya funcionando, un HTML de un solo archivo; usarla como base de comportamiento.

## Historial de versiones

- **1.0 (04/11/2026):** especificación inicial, a partir de la v1 ya en uso.
- **2.0 (04/11/2026):** reescritura modular de la app (`core`/`store`/`ui` separados, con pruebas unitarias de la regla de estado); estructura de carpetas de `INSPECCIONES/` cambiada de "por flota" a "por tipo de inspección + mes" (sección 4); botón de exportar a Excel el programa semanal/mensual de inspecciones (sección 3.4.2); corrección del combo "Control" del formulario de registrar, que podía quedar sin opciones; eliminación de los campos Horómetro y N.º de hallazgos del formulario de registrar (sección 3.4.3 y 5); publicación en GitHub Pages.

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

El MVP no tiene login: el nombre de quien registra se guarda en el navegador y se graba en cada inspección.

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

Frecuencia y aviso son **configurables** (ver `config.json`). Cada equipo genera 1 control (GENERAL), o 4 si tiene AFEX.

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

1. **Conexión de carpeta** (primera vez y cada sesión)
   - Botón "Elegir carpeta" y botón "Reconectar a «nombre»", que recuerda la última carpeta.
   - Si la carpeta está vacía (no existe `_SISTEMA/equipos.json`), la inicializa con los archivos de `datos_iniciales/`.
2. **Tablero**
   - 5 tarjetas: una por flota (solo control GENERAL) y una de AFEX (los 3 controles AFEX). Cada tarjeta muestra % al día, total de controles, barra apilada por estado y leyenda con los conteos.
   - Tabla de controles con: Código, Descripción, Modelo, Ubicación, Control, Proveedor, Última, Próxima, Días, Estado (pastilla de color) y las acciones [Registrar] e [Historial].
   - Filtros: texto (código, modelo, descripción), flota (incluye la opción "AFEX"), control, estado y ubicación.
   - Exportar a CSV lo que esté filtrado (separador `;`, UTF-8 con BOM para que Excel lo abra bien).
   - Botón **"Programa semanal/mensual (Excel)"**: genera un `.xlsx` con diseño (encabezado institucional, pastillas de color por estado) con dos hojas, *Semana* y *Mes*, con los equipos a inspeccionar en los próximos 7 y 30 días respectivamente (ventana móvil desde hoy, no semana/mes calendario). Siempre incluye VENCIDA y SIN REGISTRO en ambas hojas, sin importar el horizonte.
3. **Registrar inspección**
   - Equipo (autocompletar por código; debajo muestra descripción, modelo, flota y ubicación).
   - Control (solo los que aplican al equipo; **siempre tiene al menos la opción "Inspección general" cargada desde que se abre la pantalla**, aunque todavía no se haya escrito ningún código de equipo — en la v1 este combo podía quedar vacío si se entraba a la pestaña sin pasar por el botón [Registrar] del tablero).
   - Fecha (por defecto hoy; no se permiten fechas futuras).
   - Proveedor (se autocompleta: el del equipo, o Jhon May si es AFEX).
   - Inspector / técnico, Resultado (Sin hallazgos / Con hallazgos / Equipo fuera de servicio) y Observaciones.
   - Adjuntos múltiples (PDF, imágenes, Excel, Word).
   - Muestra la ruta destino antes de guardar.
   - El botón [Registrar] del tablero abre esta pantalla con equipo, control y fecha ya llenos.
   - **Quitados en la v2:** los campos Horómetro y N.º de hallazgos (no se piden al registrar; ver sección 5 sobre el historial de registros antiguos que sí los tienen).
4. **Historial**
   - Lista de inspecciones, la más reciente primero.
   - Filtros: equipo, control, rango de fechas.
   - Cada adjunto se abre en una pestaña nueva.
   - Permite eliminar un registro, con confirmación; los archivos adjuntos NO se borran.
   - Exportar a CSV.
5. **Equipos**
   - Lista con búsqueda; agregar y editar.
   - Campos: código (único, no editable después de crear), descripción, modelo, ubicación (Volcán, Mojón, Acarreo, Troja, Taller), flota, proveedor, tiene AFEX, activo.
6. **Configuración**
   - Frecuencia y anticipación de cada control.
   - Nombre del usuario de ese PC.
   - Cambiar carpeta y recargar datos.

## 4. Almacenamiento (decisión v1)

Carpeta local sincronizada con **Google Drive para escritorio**, por ejemplo `G:\Mi unidad\INSPECCIONES FLOTA`. Todos los usuarios abren la app sobre la misma carpeta compartida.

```
<CARPETA RAÍZ>/
  _SISTEMA/
    equipos.json
    inspecciones.json
    config.json
  INSPECCIONES/
    INSPECCIONES NIMAC/<AAAA-MM>/<codigo>/AAAA-MM-DD_<TIPO>_<n>.<ext>
    INSPECCIONES CONSTRUMARKET/<AAAA-MM>/<codigo>/...
    INSPECCIONES AFEX/<AAAA-MM>/<codigo>/...
    INSPECCIONES TALLER CONEQUISA/<AAAA-MM>/<codigo>/...
    INSPECCIONES VOLQUETES/<AAAA-MM>/<codigo>/...        (solo si el equipo no tiene proveedor asignado)
```

- La carpeta de primer nivel dentro de `INSPECCIONES/` se elige por **tipo de inspección** (quién inspecciona), no por flota: `INSPECCIONES <PROVEEDOR>` para el control GENERAL (usando el proveedor del equipo; si está vacío, se usa el nombre de la flota), y siempre `INSPECCIONES AFEX` para los tres controles AFEX, sin importar la flota del equipo.
- Dentro de esa carpeta, un nivel por mes (`AAAA-MM`, por ejemplo `2026-11`) y luego la carpeta del equipo.
- **Nombre de los adjuntos:** `AAAA-MM-DD_TIPO_n.ext`, por ejemplo `2026-11-04_GENERAL_1.pdf`. Si el nombre ya existe, se agrega el sufijo `_2`, `_3`, etc.
- Limpiar en nombres de carpeta y archivo los caracteres `\ / : * ? " < > |`.
- **No usar en nombres de carpeta caracteres especiales como "–" (guion largo):** en algunas pruebas no se listaban.
- Los adjuntos de inspecciones registradas antes de este cambio quedan donde estaban (por flota, sin mes); la app no migra archivos antiguos, solo usa la nueva estructura para lo que se registre de ahora en adelante.
- **Concurrencia:** antes de escribir `inspecciones.json` o `equipos.json`, volver a leer el archivo y agregar o modificar sobre lo leído. Así se evita pisar lo que otro usuario guardó. La app relee `inspecciones.json` cada 60 s cuando la pestaña está visible.
- **v1 técnica:** File System Access API (`showDirectoryPicker`, modo readwrite), y el handle se guarda en IndexedDB para reconectar. Solo funciona en Chrome o Edge de escritorio.

### 4.1 Distribución de la app (v2)

- `dist/index.html`: build empacado (`npm run build`), para abrir con doble clic.
- `docs/index.html`: copia de `dist/index.html` (`npm run build:pages`), publicada con GitHub Pages en `https://junivalles-cmd.github.io/inspecciones-flota/`. El repositorio es público para que Pages funcione gratis; eso expone el código y los datos de `datos_iniciales/` (no hay contraseñas ni datos financieros, solo la lista de equipos y proveedores).
- Abrir la app desde el link de Pages o desde el archivo local tiene el mismo comportamiento: `showDirectoryPicker` sigue pidiendo elegir la carpeta de Drive en la máquina de quien la usa; no hay backend ni datos compartidos por internet.

## 5. Modelo de datos

### equipos.json (arreglo)
```json
{
  "codigo": "518",            // texto, único (ej. "05-0763", "20-0016", "T2", "E2")
  "descripcion": "Tractor de orugas",
  "modelo": "D9R",
  "ubicacion": "Volcán",      // Volcán | Mojón | Acarreo | Troja | Taller | ""
  "flota": "CAT",             // CAT | KOMATSU | VOLQUETES | AUXILIAR
  "proveedor": "NIMAC",       // proveedor de la inspección general
  "afex": true,               // tiene sistema de supresión AFEX
  "activo": true
}
```

### inspecciones.json (arreglo)
```json
{
  "id": "lq3k9x2a",           // único
  "codigo": "518",
  "tipo": "GENERAL",          // GENERAL | AFEX_INSP | AFEX_MANT | AFEX_CERT
  "fecha": "2026-11-04",      // ISO, fecha de la inspección (no del registro)
  "proveedor": "NIMAC",
  "inspector": "Emilio Díaz",
  "resultado": "Sin hallazgos",
  "obs": "texto",
  "archivos": ["INSPECCIONES/CAT - NIMAC/518/2026-11-04_GENERAL_1.pdf"],  // rutas relativas a la raíz
  "creado": "2026-11-04T16:20:00.000Z",
  "usuario": "Junior Valles"
}
```
- `horometro` y `hallazgos`: campos de la v1, ya no se piden en el formulario de registrar (sección 3.4.3). Los registros antiguos que los tengan se siguen mostrando igual en Historial; los nuevos registros simplemente no los incluyen.

### config.json
```json
{ "GENERAL":   {"frecuencia_dias": 30,  "anticipacion_dias": 10},
  "AFEX_INSP": {"frecuencia_dias": 30,  "anticipacion_dias": 10},
  "AFEX_MANT": {"frecuencia_dias": 90,  "anticipacion_dias": 15},
  "AFEX_CERT": {"frecuencia_dias": 365, "anticipacion_dias": 30} }
```
(En la v1 de referencia las claves son `f` y `a`. En la nueva versión usar los nombres largos, y aceptar ambos al leer.)

## 6. Datos iniciales (`datos_iniciales/`)

- **equipos.json:** 112 equipos. CAT 41, KOMATSU 23, VOLQUETES 19, AUXILIAR 29. 52 tienen AFEX.
  - Fuentes: *FORMATO DE INSPECCIONES.xlsx* (hojas Inspecciones e Inspeccion AFEX) y el maestro *EQUIPOS MINA LL 2026.xlsx*.
  - Se excluyó el 45-26 (ya no está en la flota). El 05-0763 se incluyó.
- **inspecciones.json:** 150 registros de carga inicial: 9 GENERAL y 47 de cada control AFEX. Fechas de junio y julio de 2026, por eso casi todo aparece VENCIDO o SIN REGISTRO; es correcto.
- **config.json:** frecuencias por defecto.
- **Códigos normalizados:** 2091→20-91, 2096→20-96, 20102→20-102, 20107→20-107.

## 7. Validaciones

- Equipo existente y activo, control válido para el equipo, fecha obligatoria y no futura.
- Si no hay nombre de usuario guardado, pedirlo antes del primer registro.
- Código de equipo único al crear (sin distinguir mayúsculas).
- Mensajes de éxito y error visibles; los errores no se ocultan solos.

## 8. Casos de prueba (aceptación)

1. Carpeta vacía → al conectar se crean `_SISTEMA/*.json` con 112 equipos y 150 inspecciones.
2. Equipo 518 sin inspección general previa. Registrar GENERAL con fecha de hoy → estado AL DÍA, próxima = hoy + 30, días = 30.
3. Inspección con fecha de hace 25 días (frecuencia 30, aviso 10) → días = 5 → PROGRAMAR.
4. Inspección con fecha de hace 31 días → días = −1 → VENCIDA.
5. 45-80, con última inspección general el 29/08/2025 → VENCIDA, con más de 400 días de atraso.
6. Registrar con 2 adjuntos → quedan `INSPECCIONES/CAT - NIMAC/518/AAAA-MM-DD_GENERAL_1.pdf` y `_2.jpg`, y el registro guarda las 2 rutas.
7. Registrar 2 veces el mismo día y tipo con adjuntos → no se sobrescriben (sufijo `_2`).
8. Dos navegadores registran casi a la vez → `inspecciones.json` conserva ambos registros.
9. Cambiar AFEX_MANT a 60 días → los estados se recalculan al guardar.
10. Dar de baja un equipo → desaparece del tablero y su historial sigue visible.
11. Exportar CSV → abre en Excel con tildes correctas y columnas separadas.

## 9. Mejoras sugeridas para la versión nueva (priorizar con Junior)

1. **Uso desde el celular en campo:** pasar a PWA con backend (ej. Supabase, como la app Control de Engrase) y guardar archivos en Google Drive con la API de Drive, o hacerlo en AppSheet. La v1 no funciona en móvil.
2. Captura de fotos directa con la cámara del teléfono y compresión de imágenes.
3. Login simple por usuario y rol (inspector / consulta / administrador).
4. Correo o notificación semanal con las inspecciones VENCIDAS y por PROGRAMAR.
5. Calendario mensual de inspecciones programadas por proveedor.
6. Registro de hallazgos individuales con estado (abierto / cerrado) y su enlace al backlog.
7. Importar y exportar equipos desde Excel.
8. Más controles configurables (ej. inspección de baldes, GET de tractores) sin tocar código: tabla `tipos_control` con nombre, frecuencia, aviso, a qué flotas aplica y proveedor por defecto.

## 10. Restricciones y notas

- Idioma de la interfaz: español (Nicaragua). Fechas en `dd/mm/aaaa`; en los datos, ISO `aaaa-mm-dd`.
- Zona horaria: America/Managua (UTC−6).
- Sin dependencias de internet para la v1 (todo en el archivo).
- No borrar archivos adjuntos desde la app; solo registros.
