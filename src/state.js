// Estado de la aplicación en memoria: lo que se cargó de Supabase para la sesión activa.
// Módulo singleton (ES modules se cargan una sola vez): todas las pantallas comparten esta misma referencia.
export const D = {
  equipos: [],
  inspecciones: [],
  config: {},
};
