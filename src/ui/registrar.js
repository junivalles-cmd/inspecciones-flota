// Pantalla Registrar inspección.
import { $, hoyISO, mostrarMensaje } from './dom.js';
import { D } from '../state.js';
import { buscarEquipo } from './compartido.js';
import { tiposAplicables } from '../core/estado.js';
import { CONTROLES_NOMBRE, FLOTAS, PROVEEDOR_AFEX, esControlAfex } from '../core/dominio.js';
import { crearInspeccion } from '../store/datos.js';
import { sesion } from '../store/supabase.js';
import { conectarDrive, driveConectado, subirAdjuntos } from '../store/drive.js';

let onGuardado = () => {};

function actualizarInfoYTipos() {
  const e = buscarEquipo($('rEq').value);
  $('rEqInfo').textContent = e
    ? `${e.descripcion} ${e.modelo} · ${FLOTAS[e.flota] || ''}${e.ubicacion ? ' · ' + e.ubicacion : ''}${e.codigo2 ? ' · Ahorrativo: ' + e.codigo2 : ''}`
    : '';
  const anterior = $('rTipo').value;
  const tipos = e ? tiposAplicables(e) : ['GENERAL'];
  $('rTipo').innerHTML = tipos.map((t) => `<option value="${t}">${CONTROLES_NOMBRE[t]}</option>`).join('');
  if (tipos.includes(anterior)) $('rTipo').value = anterior;
  actualizarProveedor();
}

function actualizarProveedor() {
  const e = buscarEquipo($('rEq').value);
  if (!e) return;
  $('rProv').value = esControlAfex($('rTipo').value) ? PROVEEDOR_AFEX : e.proveedor;
}

export function prepararFormulario(codigo, tipo) {
  $('rEq').value = codigo;
  actualizarInfoYTipos();
  if (tipo) $('rTipo').value = tipo;
  actualizarProveedor();
  $('rFecha').value = hoyISO();
  $('rInsp').focus();
}

async function conectarGoogleDrive() {
  $('bConectarDrive').disabled = true;
  try {
    await conectarDrive();
    $('rDriveEstado').textContent = 'Google Drive conectado ✓';
    $('rFiles').disabled = false;
  } catch (err) {
    mostrarMensaje(err.message, 'err');
    $('bConectarDrive').disabled = false;
  }
}

async function guardar() {
  const e = buscarEquipo($('rEq').value);
  const tipo = $('rTipo').value;
  const fecha = $('rFecha').value;
  if (!e) return mostrarMensaje('Elija un equipo válido de la lista.', 'err');
  if (!fecha) return mostrarMensaje('Indique la fecha de la inspección.', 'err');
  if (fecha > hoyISO()) return mostrarMensaje('La fecha no puede ser futura.', 'err');
  const archivosElegidos = [...$('rFiles').files];
  if (archivosElegidos.length && !driveConectado()) {
    return mostrarMensaje('Conecta Google Drive antes de adjuntar archivos.', 'err');
  }
  $('bGuardar').disabled = true;
  try {
    const archivos = await subirAdjuntos(e, tipo, fecha, archivosElegidos);
    const registro = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      equipoId: e.id,
      codigo: e.codigo,
      tipo,
      fecha,
      proveedor: $('rProv').value.trim(),
      inspector: $('rInsp').value.trim(),
      resultado: $('rRes').value,
      obs: $('rObs').value.trim(),
      archivos,
      creado: new Date().toISOString(),
      usuario: sesion().nombre,
    };
    const creado = await crearInspeccion(registro);
    D.inspecciones = [creado, ...D.inspecciones];
    ['rObs', 'rInsp'].forEach((id) => ($(id).value = ''));
    $('rFiles').value = '';
    onGuardado();
    mostrarMensaje(`Inspección de ${e.codigo} guardada${archivos.length ? ' con ' + archivos.length + ' archivo(s)' : ''}.`);
  } catch (err) {
    mostrarMensaje('No se pudo guardar: ' + err.message, 'err');
  }
  $('bGuardar').disabled = false;
}

export function initRegistrar(cbs) {
  onGuardado = cbs.onGuardado;
  $('rEq').oninput = actualizarInfoYTipos;
  $('rTipo').onchange = actualizarProveedor;
  $('bGuardar').onclick = guardar;
  $('bConectarDrive').onclick = conectarGoogleDrive;
  // El HTML trae <select id="rTipo"> vacío; sin esto, el combo "Control" queda sin
  // opciones hasta que alguien escribe un código de equipo (bug reportado por el usuario).
  actualizarInfoYTipos();
}
