// Utilidades de DOM y formato compartidas por las pantallas.
import { inicioDelDia, formatearISO } from '../core/estado.js';

export const $ = (id) => document.getElementById(id);

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function hoyISO() {
  return formatearISO(inicioDelDia());
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-');
  return `${d}/${m}/${y}`;
}

export function nombreUsuario() {
  return localStorage.getItem('insp_user') || '';
}

export function guardarNombreUsuario(nombre) {
  localStorage.setItem('insp_user', nombre.trim());
}

export function mostrarMensaje(texto, tipo = 'ok') {
  $('msg').innerHTML = `<div class="msg ${tipo}">${texto}</div>`;
  if (tipo !== 'err') setTimeout(() => { $('msg').innerHTML = ''; }, 5000);
}
