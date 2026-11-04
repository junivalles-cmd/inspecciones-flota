// Selectores y listas que usan varias pantallas (filtros de flota/control, autocompletar de equipos).
import { $, esc } from './dom.js';
import { CONTROLES_NOMBRE, FLOTAS } from '../core/dominio.js';
import { buscarEquipoPorCodigo } from '../core/equipos.js';
import { D } from '../state.js';

export function llenarSelectoresEstaticos() {
  $('fFlota').innerHTML =
    '<option value="">Todas las flotas</option>' +
    Object.entries(FLOTAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('') +
    '<option value="AFEX">AFEX – Jhon May</option>';
  const opcionesControl =
    '<option value="">Todos los controles</option>' +
    Object.entries(CONTROLES_NOMBRE).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('fTipo').innerHTML = opcionesControl;
  $('hTipo').innerHTML = opcionesControl;
}

export function llenarSelectoresDinamicos() {
  const ubicaciones = [...new Set(D.equipos.map((e) => e.ubicacion).filter(Boolean))].sort();
  $('fUb').innerHTML =
    '<option value="">Todas las ubicaciones</option>' + ubicaciones.map((u) => `<option>${esc(u)}</option>`).join('');
  // Una opción por cada código (principal y, si tiene, secundario) para que el
  // autocompletar de equipo funcione escribiendo cualquiera de los dos.
  const opciones = [];
  for (const e of D.equipos) {
    if (e.activo === false) continue;
    const etiqueta = `${esc(e.descripcion)} ${esc(e.modelo)}`;
    opciones.push(`<option value="${esc(e.codigo)}">${etiqueta}</option>`);
    if (e.codigo2) opciones.push(`<option value="${esc(e.codigo2)}">${etiqueta}</option>`);
  }
  $('dlEq').innerHTML = opciones.join('');
}

export function buscarEquipo(codigo) {
  return buscarEquipoPorCodigo(D.equipos, codigo);
}
