// Pantalla Registrar inspección.
import { $, hoyISO, mostrarMensaje } from './dom.js';
import { D } from '../state.js';
import { buscarEquipo } from './compartido.js';
import { tiposAplicables } from '../core/estado.js';
import { CONTROLES_NOMBRE, FLOTAS, PROVEEDOR_AFEX, esControlAfex } from '../core/dominio.js';
import { crearInspeccion } from '../store/datos.js';
import { sesion } from '../store/supabase.js';
import { soportado, carpetaConectada, carpetaGuardada, elegirCarpeta, reconectarSiPosible, reconectarConPermiso, subirAdjuntos } from '../store/carpetaLocal.js';

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

function actualizarEstadoCarpeta() {
  const h = carpetaConectada();
  if (!h) return;
  $('rCarpetaEstado').textContent = `Carpeta conectada: «${h.name}» ✓`;
  $('rFiles').disabled = false;
}

async function actualizarBotonCarpeta() {
  if (carpetaConectada()) return actualizarEstadoCarpeta();
  const guardada = await carpetaGuardada().catch(() => null);
  if (guardada) $('bCarpetaAdjuntos').textContent = `Reconectar a «${guardada.name}»`;
}

async function elegirOReconectarCarpeta() {
  $('bCarpetaAdjuntos').disabled = true;
  try {
    const guardada = await carpetaGuardada().catch(() => null);
    if (guardada) await reconectarConPermiso();
    else await elegirCarpeta();
    actualizarEstadoCarpeta();
  } catch (err) {
    mostrarMensaje(err.message, 'err');
  }
  $('bCarpetaAdjuntos').disabled = false;
}

async function guardar() {
  const e = buscarEquipo($('rEq').value);
  const tipo = $('rTipo').value;
  const fecha = $('rFecha').value;
  if (!e) return mostrarMensaje('Elija un equipo válido de la lista.', 'err');
  if (!fecha) return mostrarMensaje('Indique la fecha de la inspección.', 'err');
  if (fecha > hoyISO()) return mostrarMensaje('La fecha no puede ser futura.', 'err');
  const archivosElegidos = [...$('rFiles').files];
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
  $('bCarpetaAdjuntos').onclick = elegirOReconectarCarpeta;
  // El HTML trae <select id="rTipo"> vacío; sin esto, el combo "Control" queda sin
  // opciones hasta que alguien escribe un código de equipo (bug reportado por el usuario).
  actualizarInfoYTipos();
  if (!soportado()) {
    $('bCarpetaAdjuntos').disabled = true;
    $('rCarpetaEstado').textContent = 'Este navegador no permite conectar una carpeta local (use Chrome o Edge de escritorio).';
    return;
  }
  reconectarSiPosible().then((ok) => (ok ? actualizarEstadoCarpeta() : actualizarBotonCarpeta()));
}
