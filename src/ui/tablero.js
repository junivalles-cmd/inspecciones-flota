// Pantalla Tablero: tarjetas por flota, tabla de controles con filtros y exportar CSV.
import { $, esc, formatearFecha } from './dom.js';
import { exportarCSV } from './csv.js';
import { D } from '../state.js';
import { calcularControles, ordenarControles, conteoPorEstado, porcentajeAlDia, ESTADOS, inicioDelDia, formatearISO } from '../core/estado.js';
import { CONTROLES_NOMBRE, FLOTAS, COLOR_ESTADO } from '../core/dominio.js';

const CLASE_ESTADO = { 'AL DÍA': 'AL', PROGRAMAR: 'PR', VENCIDA: 'VE', 'SIN REGISTRO': 'SR' };

let filasVisibles = [];
let callbacks = { irARegistrar: () => {}, irAHistorial: () => {} };

function filasTablero() {
  return ordenarControles(calcularControles(D.equipos, D.inspecciones, D.config));
}

function tarjetasKpi(rows) {
  const grupos = [
    ...Object.entries(FLOTAS).map(([k, v]) => [v, (r) => r.tipo === 'GENERAL' && r.equipo.flota === k]),
    ['AFEX – Jhon May', (r) => r.tipo !== 'GENERAL'],
  ];
  return grupos
    .map(([nombre, filtro]) => {
      const g = rows.filter(filtro);
      const n = g.length;
      const c = conteoPorEstado(g);
      const pct = porcentajeAlDia(g);
      return `<div class="card kc"><h3>${nombre}</h3><div class="big">${pct}%</div><div class="mut">al día · ${n} controles</div>
      <div class="bar">${ESTADOS.map((s) => `<span style="width:${n ? (c[s] / n) * 100 : 0}%;background:${COLOR_ESTADO[s].grafico}" title="${s}: ${c[s]}"></span>`).join('')}</div>
      <div class="leg">${ESTADOS.map((s) => `<span><i style="background:${COLOR_ESTADO[s].grafico}"></i>${s} ${c[s]}</span>`).join('')}</div></div>`;
    })
    .join('');
}

export function renderTablero() {
  const rows = filasTablero();
  $('kpis').innerHTML = tarjetasKpi(rows);

  const q = $('fBus').value.toLowerCase();
  const fl = $('fFlota').value;
  const tp = $('fTipo').value;
  const es = $('fEst').value;
  const ub = $('fUb').value;

  const filtradas = rows.filter(
    (r) =>
      (!q || (r.equipo.codigo + ' ' + r.equipo.codigo2 + ' ' + r.equipo.modelo + ' ' + r.equipo.descripcion).toLowerCase().includes(q)) &&
      (!fl || (fl === 'AFEX' ? r.tipo !== 'GENERAL' : r.equipo.flota === fl && r.tipo === 'GENERAL')) &&
      (!tp || r.tipo === tp) &&
      (!es || r.estado === es) &&
      (!ub || r.equipo.ubicacion === ub)
  );

  $('tbEst').innerHTML = filtradas
    .map(
      (r) => `<tr><td><b>${esc(r.equipo.codigo)}</b></td><td>${esc(r.equipo.codigo2)}</td><td>${esc(r.equipo.descripcion)}</td><td>${esc(r.equipo.modelo)}</td><td>${esc(r.equipo.ubicacion)}</td><td>${CONTROLES_NOMBRE[r.tipo]}</td><td>${esc(r.proveedor)}</td><td>${formatearFecha(r.ultima)}</td><td>${formatearFecha(r.proxima)}</td><td class="right">${r.dias ?? ''}</td><td><span class="st ${CLASE_ESTADO[r.estado]}">${r.estado}</span></td>
     <td style="white-space:nowrap"><button class="btn sm" data-accion="registrar" data-codigo="${esc(r.equipo.codigo)}" data-tipo="${r.tipo}">Registrar</button> <button class="lnk" data-accion="historial" data-codigo="${esc(r.equipo.codigo)}">Historial</button></td></tr>`
    )
    .join('');
  $('cntEst').textContent = filtradas.length + ' controles mostrados';
  filasVisibles = filtradas;
}

export function initTablero(cbs) {
  callbacks = cbs;
  ['fBus', 'fFlota', 'fTipo', 'fEst', 'fUb'].forEach((id) => ($(id).oninput = renderTablero));
  $('bCsvEst').onclick = () => {
    const hoy = formatearISO(inicioDelDia());
    exportarCSV(
      `estado_inspecciones_${hoy}.csv`,
      ['Código', 'Código 2', 'Descripción', 'Modelo', 'Ubicación', 'Flota', 'Control', 'Proveedor', 'Última', 'Próxima', 'Días', 'Estado'],
      filasVisibles.map((r) => [
        r.equipo.codigo,
        r.equipo.codigo2,
        r.equipo.descripcion,
        r.equipo.modelo,
        r.equipo.ubicacion,
        FLOTAS[r.equipo.flota],
        CONTROLES_NOMBRE[r.tipo],
        r.proveedor,
        formatearFecha(r.ultima),
        formatearFecha(r.proxima),
        r.dias ?? '',
        r.estado,
      ])
    );
  };
  $('tbEst').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-accion]');
    if (!btn) return;
    const { accion, codigo, tipo } = btn.dataset;
    if (accion === 'registrar') callbacks.irARegistrar(codigo, tipo);
    else if (accion === 'historial') callbacks.irAHistorial(codigo);
  });
}
