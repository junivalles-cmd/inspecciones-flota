// Pantalla Equipos: lista con búsqueda, agregar y editar (ESPECIFICACION.md sección 3.4.5).
import { $, esc, mostrarMensaje } from './dom.js';
import { D } from '../state.js';
import { buscarEquipo, llenarSelectoresDinamicos } from './compartido.js';
import { FLOTAS, UBICACIONES } from '../core/dominio.js';
import { actualizarJSON } from '../store/fs.js';
import { abrirModal, cerrarModal } from './modal.js';

let onCambio = () => {};

export function renderEquipos() {
  const q = $('eBus').value.toLowerCase();
  $('tbEq').innerHTML = D.equipos
    .filter((e) => !q || JSON.stringify(e).toLowerCase().includes(q))
    .map(
      (e) => `<tr><td><b>${esc(e.codigo)}</b></td><td>${esc(e.descripcion)}</td><td>${esc(e.modelo)}</td><td>${esc(e.ubicacion)}</td><td>${FLOTAS[e.flota] || esc(e.flota)}</td><td>${esc(e.proveedor)}</td><td>${e.afex ? 'Sí' : ''}</td><td>${e.activo === false ? 'No' : 'Sí'}</td><td><button class="lnk" data-codigo="${esc(e.codigo)}">Editar</button></td></tr>`
    )
    .join('');
}

function formularioEquipo(codigo) {
  const e = codigo
    ? buscarEquipo(codigo)
    : { codigo: '', descripcion: '', modelo: '', ubicacion: '', flota: 'CAT', proveedor: 'NIMAC', afex: false, activo: true };
  return `<h3 style="margin-top:0;color:var(--az)">${codigo ? 'Editar equipo ' + esc(codigo) : 'Agregar equipo'}</h3><div class="form">
  <div><label>Código *</label><input id="mC" value="${esc(e.codigo)}" ${codigo ? 'disabled' : ''}></div>
  <div><label>Descripción</label><input id="mD" value="${esc(e.descripcion)}"></div>
  <div><label>Modelo</label><input id="mM" value="${esc(e.modelo)}"></div>
  <div><label>Ubicación</label><input id="mU" value="${esc(e.ubicacion)}" list="dlUb"><datalist id="dlUb">${UBICACIONES.map((u) => `<option>${u}</option>`).join('')}</datalist></div>
  <div><label>Flota</label><select id="mF">${Object.entries(FLOTAS)
    .map(([k, v]) => `<option value="${k}" ${e.flota === k ? 'selected' : ''}>${v}</option>`)
    .join('')}</select></div>
  <div><label>Proveedor inspección general</label><input id="mP" value="${esc(e.proveedor)}"></div>
  <div><label>Tiene AFEX</label><select id="mA"><option value="0">No</option><option value="1" ${e.afex ? 'selected' : ''}>Sí</option></select></div>
  <div><label>Activo</label><select id="mV"><option value="1">Sí</option><option value="0" ${e.activo === false ? 'selected' : ''}>No (dado de baja)</option></select></div></div>
  <p><button class="btn" id="mGuardar">Guardar</button> <button class="btn sec" id="mCancelar">Cancelar</button></p>`;
}

function abrirFormularioEquipo(codigo) {
  abrirModal(formularioEquipo(codigo));
  $('mCancelar').onclick = cerrarModal;
  $('mGuardar').onclick = () => guardar(codigo);
}

async function guardar(codigoEditado) {
  const codigo = $('mC').value.trim();
  if (!codigo) return alert('Indique el código.');
  const equipo = {
    codigo,
    descripcion: $('mD').value.trim(),
    modelo: $('mM').value.trim(),
    ubicacion: $('mU').value.trim(),
    flota: $('mF').value,
    proveedor: $('mP').value.trim(),
    afex: $('mA').value === '1',
    activo: $('mV').value === '1',
  };
  try {
    D.equipos = await actualizarJSON('equipos.json', [], (actuales) => {
      const existente = actuales.find((x) => x.codigo.toLowerCase() === codigo.toLowerCase());
      if (!codigoEditado && existente) throw new Error('Ya existe un equipo con ese código.');
      if (existente) Object.assign(existente, equipo);
      else actuales.push(equipo);
      return actuales;
    });
    cerrarModal();
    llenarSelectoresDinamicos();
    renderEquipos();
    onCambio();
    mostrarMensaje('Equipo ' + codigo + ' guardado.');
  } catch (err) {
    alert(err.message);
  }
}

export function initEquipos(cbs) {
  onCambio = cbs.onCambio;
  $('eBus').oninput = renderEquipos;
  $('bNuevoEq').onclick = () => abrirFormularioEquipo('');
  $('tbEq').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-codigo]');
    if (btn) abrirFormularioEquipo(btn.dataset.codigo);
  });
}
