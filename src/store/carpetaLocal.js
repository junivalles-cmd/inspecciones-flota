// Adjuntos guardados en una carpeta local elegida por quien registre (File System Access
// API) — reemplaza el intento de integrar la API de Google Drive: la configuración en
// Google Cloud (verificación, scopes, test users) resultó demasiado enredo para lo que
// vale. Equipos/inspecciones/config SIGUEN en Supabase; esto es solo para los archivos.
//
// Mismo patrón que la v2: el handle de la carpeta se guarda en IndexedDB para reconectar,
// y cada quien que quiera adjuntar necesita elegir/reconectar la carpeta en su propia PC
// (no hay nada compartido entre navegadores — si solo una persona va a adjuntar archivos,
// solo esa persona necesita conectarla).
import { segmentosRutaAdjuntos } from '../core/dominio.js';

let root = null;

function idb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('insp_flota_carpeta', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function kvSet(k, v) {
  const db = await idb();
  return new Promise((resolve) => {
    const t = db.transaction('kv', 'readwrite');
    t.objectStore('kv').put(v, k);
    t.oncomplete = () => resolve();
  });
}
async function kvGet(k) {
  const db = await idb();
  return new Promise((resolve) => {
    const q = db.transaction('kv').objectStore('kv').get(k);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => resolve(null);
  });
}

export function soportado() {
  return typeof window !== 'undefined' && !!window.showDirectoryPicker;
}

export function carpetaConectada() {
  return root;
}

export async function carpetaGuardada() {
  return kvGet('root').catch(() => null);
}

export async function elegirCarpeta() {
  const h = await window.showDirectoryPicker({ id: 'inspflota-adjuntos', mode: 'readwrite' });
  await kvSet('root', h);
  root = h;
  return h;
}

// Sin pedir nada: solo funciona si el permiso ya seguía vigente en esta pestaña/sesión.
export async function reconectarSiPosible() {
  const h = await carpetaGuardada();
  if (!h) return false;
  if ((await h.queryPermission({ mode: 'readwrite' })) === 'granted') {
    root = h;
    return true;
  }
  return false;
}

// Debe llamarse desde un clic real (pide permiso con una ventana del navegador).
export async function reconectarConPermiso() {
  const h = await carpetaGuardada();
  if (!h) throw new Error('Primero elige la carpeta de adjuntos.');
  const p = await h.requestPermission({ mode: 'readwrite' });
  if (p !== 'granted') throw new Error('Permiso denegado para la carpeta.');
  root = h;
  return h;
}

async function dirAt(ruta, create = true) {
  let d = root;
  for (const p of ruta.split('/').filter(Boolean)) d = await d.getDirectoryHandle(p, { create });
  return d;
}

async function existeArchivo(dir, nombre) {
  return dir.getFileHandle(nombre).then(
    () => true,
    () => false
  );
}

// Sube los adjuntos de un registro nuevo y devuelve [{ nombre, ruta }], listo para guardar
// en inspecciones.archivos. Mismo nombrado que siempre: AAAA-MM-DD_TIPO_n.ext, con sufijo
// _2, _3… si el nombre ya existe en esa carpeta.
export async function subirAdjuntos(equipo, tipo, fecha, archivos) {
  if (!archivos.length) return [];
  if (!root) throw new Error('Conecta la carpeta de adjuntos antes de guardar.');
  const ruta = segmentosRutaAdjuntos(equipo, tipo, fecha).join('/');
  const dir = await dirAt(ruta);
  const subidos = [];
  for (let k = 0; k < archivos.length; k++) {
    const archivo = archivos[k];
    const ext = (archivo.name.includes('.') ? archivo.name.split('.').pop() : 'bin').toLowerCase();
    let nombre = `${fecha}_${tipo}_${k + 1}.${ext}`;
    let n = 1;
    while (await existeArchivo(dir, nombre)) nombre = `${fecha}_${tipo}_${k + 1}_${++n}.${ext}`;
    const h = await dir.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(archivo);
    await w.close();
    subidos.push({ nombre, ruta: ruta + '/' + nombre });
  }
  return subidos;
}

export async function abrirArchivo(ruta) {
  if (!root) throw new Error('Conecta la carpeta de adjuntos para abrir archivos.');
  const partes = ruta.split('/');
  const nombre = partes.pop();
  const dir = await dirAt(partes.join('/'), false);
  const f = await (await dir.getFileHandle(nombre)).getFile();
  window.open(URL.createObjectURL(f), '_blank');
}
