// Pantalla Registrar inspección.
import { $, hoyISO, mostrarMensaje, nombreUsuario, guardarNombreUsuario } from './dom.js';
import { D } from '../state.js';
import { buscarEquipo } from './compartido.js';
import { tiposAplicables } from '../core/estado.js';
import { CONTROLES_NOMBRE, FLOTAS, PROVEEDOR_AFEX, esControlAfex } from '../core/dominio.js';
import { rutaDestino, guardarArchivos, actualizarJSON } from '../store/fs.js';

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
  actualizarProveedorYDestino();
}

function actualizarProveedorYDestino() {
  const e = buscarEquipo($('rEq').value);
  if (!e) return;
  $('rProv').value = esControlAfex($('rTipo').value) ? PROVEEDOR_AFEX : e.proveedor;
  actualizarDestino();
}

function actualizarDestino() {
  const e = buscarEquipo($('rEq').value);
  if (!e) return;
  const fecha = $('rFecha').value || hoyISO();
  $('rDest').textContent = 'Se guardará en: ' + rutaDestino(e, $('rTipo').value, fecha) + '/';
}

export function prepararFormulario(codigo, tipo) {
  $('rEq').value = codigo;
  actualizarInfoYTipos();
  if (tipo) $('rTipo').value = tipo;
  actualizarProveedorYDestino();
  $('rFecha').value = hoyISO();
  $('rInsp').focus();
}

async function guardar() {
  const e = buscarEquipo($('rEq').value);
  const tipo = $('rTipo').value;
  const fecha = $('rFecha').value;
  if (!e) return mostrarMensaje('Elija un equipo válido de la lista.', 'err');
  if (!fecha) return mostrarMensaje('Indique la fecha de la inspección.', 'err');
  if (fecha > hoyISO()) return mostrarMensaje('La fecha no puede ser futura.', 'err');
  if (!nombreUsuario()) {
    const n = prompt('Escriba su nombre (queda registrado en cada inspección):');
    if (!n) return;
    guardarNombreUsuario(n);
  }
  $('bGuardar').disabled = true;
  try {
    const archivos = [...$('rFiles').files];
    const rutas = await guardarArchivos(e, fecha, tipo, archivos);
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
      archivos: rutas,
      creado: new Date().toISOString(),
      usuario: nombreUsuario(),
    };
    D.inspecciones = await actualizarJSON('inspecciones.json', [], (actuales) => [...actuales, registro]);
    ['rObs', 'rInsp'].forEach((id) => ($(id).value = ''));
    $('rFiles').value = '';
    onGuardado();
    mostrarMensaje(`Inspección de ${e.codigo} guardada${rutas.length ? ' con ' + rutas.length + ' archivo(s)' : ''}.`);
  } catch (err) {
    mostrarMensaje('No se pudo guardar: ' + err.message, 'err');
  }
  $('bGuardar').disabled = false;
}

export function initRegistrar(cbs) {
  onGuardado = cbs.onGuardado;
  $('rEq').oninput = actualizarInfoYTipos;
  $('rTipo').onchange = actualizarProveedorYDestino;
  $('rFecha').oninput = actualizarDestino;
  $('bGuardar').onclick = guardar;
  // El HTML trae <select id="rTipo"> vacío; sin esto, el combo "Control" queda sin
  // opciones hasta que alguien escribe un código de equipo (bug reportado por el usuario).
  actualizarInfoYTipos();
}
