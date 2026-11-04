// Pantalla Configuración: frecuencias/avisos por control, usuario del equipo y carpeta.
import { $, nombreUsuario, guardarNombreUsuario, mostrarMensaje } from './dom.js';
import { D } from '../state.js';
import { CONTROLES_NOMBRE } from '../core/dominio.js';
import { CONFIG_DEFAULT, normalizarConfig } from '../core/estado.js';
import { escribirJSON } from '../store/fs.js';

let onCambio = () => {};

export function renderConfig() {
  const config = normalizarConfig(D.config);
  $('tbCfg').innerHTML = Object.keys(CONTROLES_NOMBRE)
    .map(
      (k) => `<tr><td>${CONTROLES_NOMBRE[k]}</td><td>${k === 'GENERAL' ? 'Toda la flota' : 'Equipos con AFEX'}</td>
    <td><input type="number" min="1" id="cf_${k}" value="${config[k].frecuencia_dias}" style="width:90px"></td>
    <td><input type="number" min="0" id="ca_${k}" value="${config[k].anticipacion_dias}" style="width:90px"></td></tr>`
    )
    .join('');
  $('cUser').value = nombreUsuario();
}

async function guardarConfig() {
  const nueva = {};
  for (const k of Object.keys(CONTROLES_NOMBRE)) {
    nueva[k] = {
      frecuencia_dias: Number($('cf_' + k).value) || CONFIG_DEFAULT[k].frecuencia_dias,
      anticipacion_dias: Number($('ca_' + k).value) || 0,
    };
  }
  await escribirJSON('config.json', nueva);
  D.config = nueva;
  onCambio();
  mostrarMensaje('Configuración guardada.');
}

export function initConfig(cbs) {
  onCambio = cbs.onCambio;
  $('bCfg').onclick = guardarConfig;
  $('bUser').onclick = () => {
    guardarNombreUsuario($('cUser').value.trim());
    onCambio();
    mostrarMensaje('Nombre guardado.');
  };
}
