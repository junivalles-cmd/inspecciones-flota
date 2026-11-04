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
  // Una sola opción por equipo (no una por código): si tiene Ahorrativo se agrega
  // al texto para poder encontrarlo escribiendo cualquiera de los dos códigos, pero
  // sin que el mismo equipo aparezca dos veces en la lista. buscarEquipo() ya resuelve
  // por cualquiera de los dos códigos aunque no se elija de esta lista.
  const opciones = D.equipos
    .filter((e) => e.activo !== false)
    .map((e) => {
      const etiqueta = `${esc(e.descripcion)} ${esc(e.modelo)}`;
      const ahorrativo = e.codigo2 ? ` · Ahorrativo ${esc(e.codigo2)}` : '';
      return `<option value="${esc(e.codigo)}">${etiqueta}${ahorrativo}</option>`;
    });
  $('dlEq').innerHTML = opciones.join('');
}

export function buscarEquipo(codigo) {
  return buscarEquipoPorCodigo(D.equipos, codigo);
}
