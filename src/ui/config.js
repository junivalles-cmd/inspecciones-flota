// Pantalla Configuración: frecuencias/avisos por control.
import { $, mostrarMensaje } from './dom.js';
import { D } from '../state.js';
import { CONTROLES_NOMBRE, APLICA_A_POR_CONTROL } from '../core/dominio.js';
import { CONFIG_DEFAULT, normalizarConfig } from '../core/estado.js';
import { guardarConfig as guardarConfigRemoto } from '../store/datos.js';
import { esAdmin } from '../store/supabase.js';

let onCambio = () => {};

export function renderConfig() {
  $('bCfg').classList.toggle('hide', !esAdmin());
  const config = normalizarConfig(D.config);
  const soloLectura = !esAdmin();
  $('tbCfg').innerHTML = Object.keys(CONTROLES_NOMBRE)
    .map(
      (k) => `<tr><td>${CONTROLES_NOMBRE[k]}</td><td>${APLICA_A_POR_CONTROL[k] || ''}</td>
    <td><input type="number" min="1" id="cf_${k}" value="${config[k].frecuencia_dias}" style="width:90px" ${soloLectura ? 'disabled' : ''}></td>
    <td><input type="number" min="0" id="ca_${k}" value="${config[k].anticipacion_dias}" style="width:90px" ${soloLectura ? 'disabled' : ''}></td></tr>`
    )
    .join('');
}

async function guardarConfig() {
  const nueva = {};
  const filas = [];
  for (const k of Object.keys(CONTROLES_NOMBRE)) {
    const fila = {
      frecuencia_dias: Number($('cf_' + k).value) || CONFIG_DEFAULT[k].frecuencia_dias,
      anticipacion_dias: Number($('ca_' + k).value) || 0,
    };
    nueva[k] = fila;
    filas.push({ tipo: k, ...fila });
  }
  try {
    await guardarConfigRemoto(filas);
    D.config = nueva;
    onCambio();
    mostrarMensaje('Configuración guardada.');
  } catch (err) {
    mostrarMensaje('No se pudo guardar: ' + err.message, 'err');
  }
}

export function initConfig(cbs) {
  onCambio = cbs.onCambio;
  $('bCfg').onclick = guardarConfig;
}
