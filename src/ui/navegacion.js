// Cambio de pestaña (Tablero / Registrar / Historial / Equipos / Configuración).
import { $, hoyISO } from './dom.js';

export function mostrarTab(id) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('hide', t.id !== id));
  document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.dataset.t === id));
}

export function initNavegacion() {
  document.querySelectorAll('nav button').forEach((b) => {
    b.onclick = () => {
      mostrarTab(b.dataset.t);
      if (b.dataset.t === 'tab-registrar' && !$('rFecha').value) $('rFecha').value = hoyISO();
    };
  });
}
