// Almacenamiento en la carpeta de Google Drive, vía File System Access API.
// ESPECIFICACION.md sección 4: estructura de carpetas, nombres de archivo y concurrencia.
import { kvGet, kvSet } from './idb.js';
import { carpetaTipoInspeccion } from '../core/dominio.js';
import { SEED } from './seed.js';

let root = null;

export function soportado() {
  return typeof window !== 'undefined' && !!window.showDirectoryPicker;
}

export function carpetaActual() {
  return root;
}

// Limpia caracteres no permitidos en nombres de carpeta/archivo: \ / : * ? " < > |
export function limpiarNombre(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, '-').trim();
}

// Estructura: INSPECCIONES/<carpeta del tipo>/<AAAA-MM>/<código del equipo>/
// Ej.: INSPECCIONES/INSPECCIONES NIMAC/2026-11/45-80/, INSPECCIONES/INSPECCIONES AFEX/2026-11/568/
export function rutaDestino(equipo, tipo, fecha) {
  const mes = fecha.slice(0, 7);
  return `INSPECCIONES/${limpiarNombre(carpetaTipoInspeccion(equipo, tipo))}/${mes}/${limpiarNombre(equipo.codigo)}`;
}

async function dirAt(path, create = true) {
  let d = root;
  for (const p of path.split('/').filter(Boolean)) {
    d = await d.getDirectoryHandle(p, { create });
  }
  return d;
}

export async function existeArchivoSistema(nombre) {
  try {
    const d = await dirAt('_SISTEMA', false);
    await d.getFileHandle(nombre);
    return true;
  } catch {
    return false;
  }
}

export async function leerJSON(nombre, porDefecto) {
  try {
    const d = await dirAt('_SISTEMA');
    const f = await (await d.getFileHandle(nombre)).getFile();
    return JSON.parse(await f.text());
  } catch {
    return porDefecto;
  }
}

export async function escribirJSON(nombre, datos) {
  const d = await dirAt('_SISTEMA');
  const h = await d.getFileHandle(nombre, { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify(datos, null, 1));
  await w.close();
}

// Patrón de concurrencia (sección 4): releer el archivo justo antes de escribir
// y aplicar la modificación sobre lo leído, para no pisar lo que otro usuario guardó.
export async function actualizarJSON(nombre, porDefecto, modificar) {
  const actual = await leerJSON(nombre, porDefecto);
  const siguiente = modificar(actual);
  await escribirJSON(nombre, siguiente);
  return siguiente;
}

export async function inicializarSiVacio() {
  if (await existeArchivoSistema('equipos.json')) return false;
  await escribirJSON('equipos.json', SEED.equipos);
  await escribirJSON('inspecciones.json', SEED.inspecciones);
  await escribirJSON('config.json', SEED.config);
  return true;
}

export async function conectar(handle) {
  root = handle;
  const inicializado = await inicializarSiVacio();
  return { inicializado };
}

export async function elegirCarpeta() {
  const h = await window.showDirectoryPicker({ id: 'inspflota', mode: 'readwrite' });
  await kvSet('root', h);
  return conectar(h);
}

export async function carpetaGuardada() {
  return kvGet('root').catch(() => null);
}

export async function permisoConcedido(handle) {
  return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
}

export async function reconectar(handle) {
  const p = await handle.requestPermission({ mode: 'readwrite' });
  if (p !== 'granted') throw new Error('Permiso denegado para la carpeta.');
  return conectar(handle);
}

// Guarda archivos adjuntos con el nombre AAAA-MM-DD_TIPO_n.ext; si ya existe, agrega sufijo _2, _3…
export async function guardarArchivos(equipo, fecha, tipo, files) {
  if (!files.length) return [];
  const folder = rutaDestino(equipo, tipo, fecha);
  const d = await dirAt(folder);
  const rutas = [];
  for (let k = 0; k < files.length; k++) {
    const f = files[k];
    const ext = (f.name.includes('.') ? f.name.split('.').pop() : 'bin').toLowerCase();
    let nombre = `${fecha}_${tipo}_${k + 1}.${ext}`;
    let n = 1;
    while (await d.getFileHandle(nombre).then(() => true, () => false)) {
      nombre = `${fecha}_${tipo}_${k + 1}_${++n}.${ext}`;
    }
    const h = await d.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(f);
    await w.close();
    rutas.push(folder + '/' + nombre);
  }
  return rutas;
}

export async function abrirArchivo(ruta) {
  const partes = ruta.split('/');
  const nombre = partes.pop();
  const d = await dirAt(partes.join('/'), false);
  const f = await (await d.getFileHandle(nombre)).getFile();
  window.open(URL.createObjectURL(f), '_blank');
}
