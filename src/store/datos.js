// Lectura/escritura de equipos, inspecciones y config contra Supabase (supabase/schema.sql).
// Reemplaza al módulo de archivos de la v2 (File System Access API).
import { peticion } from './supabase.js';

// La tabla usa equipo_id (snake_case); el resto de la app (core/estado.js) espera equipoId.
function mapearInspeccion(fila) {
  const { equipo_id, ...resto } = fila;
  return { ...resto, equipoId: equipo_id };
}

export async function leerEquipos() {
  return peticion('equipos?select=*&order=codigo');
}

export async function leerInspecciones() {
  const filas = await peticion('inspecciones?select=*&order=fecha.desc');
  return filas.map(mapearInspeccion);
}

export async function leerConfig() {
  const filas = await peticion('config?select=*');
  const porTipo = {};
  for (const f of filas) porTipo[f.tipo] = { frecuencia_dias: f.frecuencia_dias, anticipacion_dias: f.anticipacion_dias };
  return porTipo;
}

export async function crearEquipo(datos) {
  const [fila] = await peticion('equipos', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(datos),
  });
  return fila;
}

export async function actualizarEquipo(id, datos) {
  const [fila] = await peticion(`equipos?id=eq.${id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(datos),
  });
  return fila;
}

export async function crearInspeccion(registro) {
  const { equipoId, ...resto } = registro;
  const [fila] = await peticion('inspecciones', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ ...resto, equipo_id: equipoId }),
  });
  return mapearInspeccion(fila);
}

export async function eliminarInspeccion(id) {
  return peticion(`inspecciones?id=eq.${id}`, { method: 'DELETE' });
}

// `filas` = [{ tipo, frecuencia_dias, anticipacion_dias }, ...] — upsert por tipo.
export async function guardarConfig(filas) {
  await peticion('config?on_conflict=tipo', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(filas),
  });
}
