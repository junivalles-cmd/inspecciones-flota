// Selectores y listas que usan varias pantallas (filtros de flota/control, autocompletar de equipos).
import { $, esc } from './dom.js';
import { CONTROLES_NOMBRE, FLOTAS } from '../core/dominio.js';
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
  $('dlEq').innerHTML = D.equipos
    .filter((e) => e.activo !== false)
    .map((e) => `<option value="${esc(e.codigo)}">${esc(e.descripcion)} ${esc(e.modelo)}</option>`)
    .join('');
}

export function buscarEquipo(codigo) {
  return D.equipos.find((e) => e.codigo.toLowerCase() === String(codigo).trim().toLowerCase());
}
