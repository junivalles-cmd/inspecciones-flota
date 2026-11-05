// Pantalla Historial: lista de inspecciones, filtros, eliminar y exportar CSV.
import { $, esc, formatearFecha, hoyISO, mostrarMensaje } from './dom.js';
import { exportarCSV } from './csv.js';
import { D } from '../state.js';
import { CONTROLES_NOMBRE } from '../core/dominio.js';
import { eliminarInspeccion } from '../store/datos.js';
import { iconoClip } from './iconos.js';

const LIMITE_FILAS = 800;
let filasVisibles = [];
let onCambio = () => {};

function filasHistorial() {
  const q = $('hBus').value.trim().toLowerCase();
  const tp = $('hTipo').value;
  const de = $('hDesde').value;
  const ha = $('hHasta').value;
  return D.inspecciones
    .filter(
      (i) =>
        (!q || i.codigo.toLowerCase() === q || i.codigo.toLowerCase().includes(q)) &&
        (!tp || i.tipo === tp) &&
        (!de || i.fecha >= de) &&
        (!ha || i.fecha <= ha)
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

// Los adjuntos todavía no se pueden abrir desde la app (pendiente integración con Drive,
// sección "Siguiente etapa"); por ahora solo se muestra cuántos tiene.
function celdaArchivos(i) {
  const n = (i.archivos || []).length;
  return n ? `${iconoClip()}${n}` : '';
}

export function renderHistorial() {
  const f = filasHistorial();
  $('tbHis').innerHTML = f
    .slice(0, LIMITE_FILAS)
    .map(
      (i) => `<tr><td>${formatearFecha(i.fecha)}</td><td><b>${esc(i.codigo)}</b></td><td>${CONTROLES_NOMBRE[i.tipo] || i.tipo}</td><td>${esc(i.proveedor)}</td><td>${esc(i.inspector)}</td><td>${esc(i.resultado)}</td><td>${esc(i.obs)}</td>
     <td class="mut">${celdaArchivos(i)}</td><td class="mut">${esc(i.usuario)}</td><td><button class="lnk" data-accion="eliminar" data-id="${i.id}" title="Eliminar registro">✕</button></td></tr>`
    )
    .join('');
  $('cntHis').textContent = f.length + ' inspecciones' + (f.length > LIMITE_FILAS ? ` (se muestran las ${LIMITE_FILAS} más recientes)` : '');
  filasVisibles = f;
}

export function irAHistorial(codigo) {
  $('hBus').value = codigo;
  renderHistorial();
}

async function eliminar(id) {
  const i = D.inspecciones.find((x) => x.id === id);
  if (!i) return;
  if (!confirm(`¿Eliminar el registro de ${i.codigo} del ${formatearFecha(i.fecha)}?`)) return;
  try {
    await eliminarInspeccion(id);
    D.inspecciones = D.inspecciones.filter((x) => x.id !== id);
    renderHistorial();
    onCambio();
    mostrarMensaje('Registro eliminado.');
  } catch (err) {
    mostrarMensaje('No se pudo eliminar: ' + err.message, 'err');
  }
}

export function initHistorial(cbs) {
  onCambio = cbs.onCambio;
  ['hBus', 'hTipo', 'hDesde', 'hHasta'].forEach((id) => ($(id).oninput = renderHistorial));
  $('bCsvHis').onclick = () =>
    exportarCSV(
      `historial_inspecciones_${hoyISO()}.csv`,
      ['Fecha', 'Código', 'Control', 'Proveedor', 'Inspector', 'Resultado', 'Observaciones', 'Archivos', 'Registró'],
      filasVisibles.map((i) => [
        formatearFecha(i.fecha),
        i.codigo,
        CONTROLES_NOMBRE[i.tipo] || i.tipo,
        i.proveedor,
        i.inspector,
        i.resultado,
        i.obs,
        (i.archivos || []).length,
        i.usuario,
      ])
    );
  $('tbHis').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (btn && btn.dataset.accion === 'eliminar') eliminar(btn.dataset.id);
  });
}
