// Datos iniciales embebidos en el build (ESPECIFICACION.md sección 6).
// Vite los incluye como objetos JS dentro del único archivo HTML generado.
import equipos from '../../datos_iniciales/equipos.json';
import inspecciones from '../../datos_iniciales/inspecciones.json';
import config from '../../datos_iniciales/config.json';

export const SEED = { equipos, inspecciones, config };
