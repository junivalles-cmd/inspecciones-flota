# Prompt para iniciar en Claude Code

Copia esta carpeta completa como raíz del proyecto, abre Claude Code en ella y pega el texto de abajo.

---

Lee `ESPECIFICACION.md` completo y revisa `referencia/Sistema_Inspecciones_Flota_v1.html`. Es la versión 1 que ya funciona: conserva su lógica de estados y su comportamiento.

Objetivo: construir la versión 2 del **Sistema de Inspecciones de Flota** de CONEQUISA – Mina La Libertad.

Requisitos para esta etapa:
1. Misma funcionalidad de la v1: tablero, registrar, historial, equipos, configuración, exportar CSV, y almacenamiento en carpeta de Google Drive mediante File System Access API.
2. Código organizado en módulos (estado/cálculo, almacenamiento, interfaz), con la regla de estado de la sección 3.3 en una función pura con pruebas unitarias que cubran los casos 2 a 5 de la sección 8.
3. Que siga pudiendo entregarse como **un solo archivo HTML** (usa un build que lo empaquete, por ejemplo Vite con vite-plugin-singlefile), para que se abra con doble clic en Chrome o Edge.
4. Cargar `datos_iniciales/*.json` cuando la carpeta esté vacía (embebidos en el build).
5. `config.json` con claves `frecuencia_dias` / `anticipacion_dias`, aceptando también `f` / `a` de la v1.
6. Diseño limpio con los colores de la sección 3.3; interfaz en español.

Antes de programar, muéstrame un plan corto: estructura de carpetas, librerías y pasos. Después implementa por etapas y corre las pruebas.
Al final, dame el HTML empaquetado en `dist/` y un README con cómo usarlo.

Siguiente etapa (no hacer todavía, solo dejar el código preparado): las mejoras de la sección 9, empezando por la versión móvil con backend.
