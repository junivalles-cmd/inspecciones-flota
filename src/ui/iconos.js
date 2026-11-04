// Iconos SVG en línea (en vez de emojis) — trazo simple, 24x24, heredan color por currentColor.
// Se usan vía clase CSS .icon para el tamaño; aria-hidden porque siempre van junto a texto visible.
const base = (contenido) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${contenido}</svg>`;

export const iconoCarpeta = () =>
  base('<path d="M3 7a1 1 0 0 1 1-1h4.5l1.5 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7z"/>');

export const iconoUsuario = () =>
  base('<circle cx="12" cy="8" r="3.3"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>');

export const iconoCalendario = () =>
  base('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>');

export const iconoClip = () =>
  base('<path d="M8 12.5l5.2-5.2a3 3 0 1 1 4.2 4.2L10.6 18.3a4.6 4.6 0 0 1-6.5-6.5l6.6-6.6"/>');
