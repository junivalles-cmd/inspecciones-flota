// Subida de adjuntos a Google Drive (Etapa 2). Usa Google Identity Services (OAuth en el
// navegador, sin backend propio) y la API de Drive v3 directo por fetch.
//
// Permiso independiente del login de Supabase: cada sesión del navegador tiene que
// "Conectar Google Drive" una vez (botón en Registrar) antes de poder adjuntar archivos.
import { segmentosRutaAdjuntos } from '../core/dominio.js';

const CLIENT_ID = '559483715649-msvgn0tu7hep9hffeac5i4e7balnfgaq.apps.googleusercontent.com';
const SCOPE = 'https://www.googleapis.com/auth/drive';
// "INSPECCIONES MINA LA LIBERTAD" — la carpeta raíz que ya se usaba con File System Access API.
const CARPETA_RAIZ = '1J-5EJ03_31p29t_TjszSeVepf9tolQoK';

let tokenClient = null;
let tokenActual = null; // { access_token, expira }
const cacheCarpetas = new Map(); // "idPadre/nombre" -> id

function cargarGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const existente = document.getElementById('gis-script');
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar el inicio de sesión de Google.')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el inicio de sesión de Google.'));
    document.head.appendChild(script);
  });
}

export function driveConectado() {
  return !!tokenActual && Date.now() < tokenActual.expira;
}

// Debe llamarse desde un clic real del usuario (botón "Conectar Google Drive"); GIS
// necesita ese gesto para poder abrir la ventana de autorización la primera vez.
export async function conectarDrive() {
  await cargarGis();
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: () => {} });
  }
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) return reject(new Error('No se pudo autorizar el acceso a Google Drive (' + resp.error + ').'));
      tokenActual = { access_token: resp.access_token, expira: Date.now() + (resp.expires_in || 3600) * 1000 };
      resolve(tokenActual.access_token);
    };
    tokenClient.requestAccessToken();
  });
}

async function tokenValido() {
  if (driveConectado()) return tokenActual.access_token;
  throw new Error('Primero conecta Google Drive (botón arriba del formulario).');
}

async function peticionDrive(url, opciones = {}) {
  const token = await tokenValido();
  const resp = await fetch(url, { ...opciones, headers: { Authorization: `Bearer ${token}`, ...(opciones.headers || {}) } });
  if (!resp.ok) {
    const texto = await resp.text().catch(() => '');
    throw new Error(`Google Drive respondió con error (${resp.status}): ${texto.slice(0, 200)}`);
  }
  return resp.json();
}

async function buscarOCrearCarpeta(nombre, idPadre) {
  const clave = idPadre + '/' + nombre;
  if (cacheCarpetas.has(clave)) return cacheCarpetas.get(clave);
  const q = `'${idPadre}' in parents and name='${nombre.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const lista = await peticionDrive(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`);
  let id = lista.files && lista.files[0] && lista.files[0].id;
  if (!id) {
    const creada = await peticionDrive('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [idPadre] }),
    });
    id = creada.id;
  }
  cacheCarpetas.set(clave, id);
  return id;
}

async function resolverCarpeta(segmentos) {
  let idActual = CARPETA_RAIZ;
  for (const seg of segmentos) idActual = await buscarOCrearCarpeta(seg, idActual);
  return idActual;
}

async function existeArchivo(carpetaId, nombre) {
  const q = `'${carpetaId}' in parents and name='${nombre.replace(/'/g, "\\'")}' and trashed=false`;
  const lista = await peticionDrive(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`);
  return !!(lista.files && lista.files[0]);
}

async function subirArchivo(carpetaId, nombreArchivo, archivo) {
  const metadata = { name: nombreArchivo, parents: [carpetaId] };
  const boundary = 'insp' + Math.random().toString(36).slice(2);
  const delimitador = `\r\n--${boundary}\r\n`;
  const cierre = `\r\n--${boundary}--`;
  const codificador = new TextEncoder();
  const cuerpo = new Blob([
    codificador.encode(delimitador + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
    codificador.encode(delimitador + `Content-Type: ${archivo.type || 'application/octet-stream'}\r\n\r\n`),
    archivo,
    codificador.encode(cierre),
  ]);
  const token = await tokenValido();
  const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: cuerpo,
  });
  if (!resp.ok) throw new Error(`No se pudo subir "${nombreArchivo}" (HTTP ${resp.status}).`);
  return resp.json();
}

// Sube los adjuntos de un registro nuevo y devuelve [{ nombre, drive_file_id, url }],
// listo para guardar en inspecciones.archivos. Mismo nombrado que la v2: AAAA-MM-DD_TIPO_n.ext,
// con sufijo _2, _3… si el nombre ya existe en esa carpeta.
export async function subirAdjuntos(equipo, tipo, fecha, archivos) {
  if (!archivos.length) return [];
  const carpetaId = await resolverCarpeta(segmentosRutaAdjuntos(equipo, tipo, fecha));
  const subidos = [];
  for (let k = 0; k < archivos.length; k++) {
    const archivo = archivos[k];
    const ext = (archivo.name.includes('.') ? archivo.name.split('.').pop() : 'bin').toLowerCase();
    let nombre = `${fecha}_${tipo}_${k + 1}.${ext}`;
    let n = 1;
    while (await existeArchivo(carpetaId, nombre)) {
      nombre = `${fecha}_${tipo}_${k + 1}_${++n}.${ext}`;
    }
    const resultado = await subirArchivo(carpetaId, nombre, archivo);
    subidos.push({ nombre, drive_file_id: resultado.id, url: resultado.webViewLink });
  }
  return subidos;
}
