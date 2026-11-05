import './styles.css';
import { $, esc, mostrarMensaje } from './ui/dom.js';
import { D } from './state.js';
import { llenarSelectoresEstaticos, llenarSelectoresDinamicos } from './ui/compartido.js';
import { mostrarTab, initNavegacion } from './ui/navegacion.js';
import { initTablero, renderTablero } from './ui/tablero.js';
import { initRegistrar, prepararFormulario } from './ui/registrar.js';
import { initHistorial, renderHistorial, irAHistorial as mostrarHistorialDe } from './ui/historial.js';
import { initEquipos, renderEquipos } from './ui/equipos.js';
import { initConfig, renderConfig } from './ui/config.js';
import { generarProgramaInspecciones } from './ui/excel.js';
import { iconoUsuario } from './ui/iconos.js';
import { iniciarSesion, cerrarSesion, sesion } from './store/supabase.js';
import { leerEquipos, leerInspecciones, leerConfig } from './store/datos.js';

function renderTodo() {
  renderTablero();
  renderHistorial();
  renderEquipos();
  renderConfig();
  $('pUser').innerHTML = iconoUsuario() + esc(sesion().nombre);
}

async function cargarDatos() {
  const [equipos, inspecciones, config] = await Promise.all([leerEquipos(), leerInspecciones(), leerConfig()]);
  D.equipos = equipos;
  D.inspecciones = inspecciones;
  D.config = config;
  llenarSelectoresDinamicos();
  renderTodo();
}

async function entrarAlSistema() {
  try {
    await cargarDatos();
  } catch (err) {
    mostrarMensaje('No se pudieron cargar los datos: ' + err.message, 'err');
    if (!sesion()) return salir(); // la sesión guardada expiró (ver tokenValido en supabase.js)
  }
  $('login').classList.add('hide');
  $('nav').classList.remove('hide');
  $('bSalir').classList.remove('hide');
  mostrarTab('tab-tablero');
}

async function entrar() {
  const usuario = $('lUsuario').value.trim();
  const password = $('lPassword').value;
  if (!usuario || !password) return mostrarMensaje('Escriba usuario y contraseña.', 'err');
  $('bEntrar').disabled = true;
  try {
    await iniciarSesion(usuario, password);
    $('lPassword').value = '';
    await entrarAlSistema();
  } catch (err) {
    mostrarMensaje(err.message, 'err');
  }
  $('bEntrar').disabled = false;
}

function salir() {
  cerrarSesion();
  D.equipos = [];
  D.inspecciones = [];
  D.config = {};
  $('nav').classList.add('hide');
  $('bSalir').classList.add('hide');
  $('pUser').innerHTML = '';
  $('lUsuario').value = '';
  $('login').classList.remove('hide');
  mostrarTab('tab-tablero');
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
  $('bEntrar').onclick = entrar;
  $('lPassword').onkeydown = (e) => {
    if (e.key === 'Enter') entrar();
  };
  $('bSalir').onclick = salir;
  $('bRecargar').onclick = async () => {
    await cargarDatos();
    mostrarMensaje('Datos recargados.');
  };
}

async function iniciar() {
  llenarSelectoresEstaticos();
  wire();
  if (sesion()) {
    await entrarAlSistema();
  }
}

iniciar();
