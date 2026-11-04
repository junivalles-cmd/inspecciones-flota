import { $ } from './dom.js';

export function abrirModal(html) {
  $('modalBody').innerHTML = html;
  $('modal').classList.remove('hide');
}

export function cerrarModal() {
  $('modal').classList.add('hide');
}

$('modal').onclick = (e) => {
  if (e.target.id === 'modal') cerrarModal();
};
