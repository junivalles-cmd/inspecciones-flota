import './styles.css';
import { $, mostrarMensaje, nombreUsuario } from './ui/dom.js';
import { D } from './state.js';
import { llenarSelectoresEstaticos, llenarSelectoresDinamicos } from './ui/compartido.js';
import { mostrarTab, initNavegacion } from './ui/navegacion.js';
import { initTablero, renderTablero } from './ui/tablero.js';
import { initRegistrar, prepararFormulario } from './ui/registrar.js';
import { initHistorial, renderHistorial, irAHistorial as mostrarHistorialDe } from './ui/historial.js';
import { initEquipos, renderEquipos } from './ui/equipos.js';
import { initConfig, renderConfig } from './ui/config.js';
import { generarProgramaInspecciones } from './ui/excel.js';
import {
  soportado,
  elegirCarpeta,
  carpetaGuardada,
  permisoConcedido,
  reconectar,
  leerJSON,
  carpetaActual,
} from './store/fs.js';

function renderTodo() {
  renderTablero();
  renderHistorial();
  renderEquipos();
  renderConfig();
  $('pUser').textContent = nombreUsuario() ? '👤 ' + nombreUsuario() : '👤 sin usuario';
}

async function cargarDatos() {
  D.equipos = await leerJSON('equipos.json', []);
  D.inspecciones = await leerJSON('inspecciones.json', []);
  D.config = await leerJSON('config.json', {});
  llenarSelectoresDinamicos();
  renderTodo();
}

async function entrarAlTablero(handle, inicializado) {
  $('pFolder').textContent = '📁 ' + handle.name;
  $('cFolder').textContent = 'Carpeta conectada: ' + handle.name;
  if (inicializado) mostrarMensaje('Carpeta preparada: se cargaron los equipos y las inspecciones anteriores.');
  await cargarDatos();
  $('welcome').classList.add('hide');
  $('nav').classList.remove('hide');
  mostrarTab('tab-tablero');
}

async function elegir() {
  try {
    const { inicializado } = await elegirCarpeta();
    await entrarAlTablero(carpetaActual(), inicializado);
  } catch (e) {
    if (e.name !== 'AbortError') mostrarMensaje('No se pudo abrir la carpeta: ' + e.message, 'err');
  }
}

async function reconectarUltima() {
  const h = await carpetaGuardada();
  if (!h) return elegir();
  try {
    const { inicializado } = await reconectar(h);
    await entrarAlTablero(h, inicializado);
  } catch (err) {
    mostrarMensaje(err.message, 'err');
  }
}

function wire() {
  initNavegacion();
  initTablero({
    irARegistrar: (codigo, tipo) => {
      mostrarTab('tab-registrar');
      prepararFormulario(codigo, tipo);
    },
    irAHistorial: (codigo) => {
      mostrarTab('tab-historial');
      mostrarHistorialDe(codigo);
    },
  });
  initRegistrar({ onGuardado: renderTodo });
  initHistorial({ onCambio: renderTablero });
  initEquipos({ onCambio: renderTablero });
  initConfig({ onCambio: renderTodo });

  $('bExcelProg').onclick = async () => {
    $('bExcelProg').disabled = true;
    try {
      await generarProgramaInspecciones();
      mostrarMensaje('Programa de inspecciones (Excel) generado.');
    } catch (err) {
      mostrarMensaje('No se pudo generar el Excel: ' + err.message, 'err');
    }
    $('bExcelProg').disabled = false;
  };
  $('bPick').onclick = elegir;
  $('bRe').onclick = reconectarUltima;
  $('bCambiar').onclick = elegir;
  $('bRecargar').onclick = async () => {
    await cargarDatos();
    mostrarMensaje('Datos recargados.');
  };
}

async function iniciar() {
  llenarSelectoresEstaticos();
  wire();

  if (!soportado()) {
    $('noApi').classList.remove('hide');
    $('bPick').disabled = true;
    return;
  }

  const h = await carpetaGuardada();
  if (h) {
    $('bRe').classList.remove('hide');
    $('bRe').textContent = `Reconectar a «${h.name}»`;
    if (await permisoConcedido(h)) {
      const { inicializado } = await reconectar(h);
      await entrarAlTablero(h, inicializado);
    }
  }

  // Relee inspecciones.json cada 60 s (sección 4): detecta registros guardados por otros usuarios.
  setInterval(async () => {
    if (!carpetaActual() || document.visibilityState !== 'visible') return;
    const nuevas = await leerJSON('inspecciones.json', null);
    if (nuevas && nuevas.length !== D.inspecciones.length) {
      D.inspecciones = nuevas;
      renderTodo();
    }
  }, 60000);
}

iniciar();
