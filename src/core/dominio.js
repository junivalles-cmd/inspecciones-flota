// Constantes del dominio (ESPECIFICACION.md secciones 3.1 y 3.2). No tienen lógica, solo datos fijos.

export const FLOTAS = {
  CAT: 'NIMAC – Caterpillar',
  KOMATSU: 'Construmarket – Komatsu',
  VOLQUETES: 'Acarreo – Volquetes',
  AUXILIAR: 'Flota auxiliar',
};

export function esControlAfex(tipo) {
  return tipo.startsWith('AFEX_');
}

// Carpeta destino dentro de INSPECCIONES/, agrupada por tipo de inspección (quién inspecciona),
// no por flota: "INSPECCIONES NIMAC", "INSPECCIONES CONSTRUMARKET", "INSPECCIONES AFEX"…
// Los controles AFEX siempre van a su propia carpeta, sin importar la flota del equipo.
// Los demás controles (GENERAL, RODAJES, BALDES, IMPLEMENTOS) los hace el taller/proveedor
// de siempre, así que comparten carpeta con la inspección general del equipo.
// Sin guion largo "–" en los nombres de carpeta (algunos sincronizadores de Drive no los listan bien).
export function carpetaTipoInspeccion(equipo, tipo) {
  if (esControlAfex(tipo)) return 'INSPECCIONES AFEX';
  const proveedor = (equipo.proveedor || '').trim() || equipo.flota;
  return 'INSPECCIONES ' + proveedor.toUpperCase();
}

export function limpiarNombre(s) {
  return String(s).replace(/[\\/:*?"<>|]/g, '-').trim();
}

// Segmentos de carpeta (de la raíz de Drive hacia adentro) donde van los adjuntos de un
// control: INSPECCIONES/<tipo o AFEX>/<AAAA-MM>/<código>. Mismo criterio de la v2
// (File System Access API), ahora para crear/encontrar las carpetas por la API de Drive.
export function segmentosRutaAdjuntos(equipo, tipo, fecha) {
  const mes = fecha.slice(0, 7);
  return ['INSPECCIONES', carpetaTipoInspeccion(equipo, tipo), mes, equipo.codigo].map(limpiarNombre);
}

export const CONTROLES_NOMBRE = {
  GENERAL: 'Inspección general',
  AFEX_INSP: 'AFEX – Inspección',
  AFEX_MANT: 'AFEX – Mantenimiento',
  AFEX_CERT: 'AFEX – Recertificación',
  RODAJES: 'Inspección de rodajes',
  BALDES: 'Inspección de baldes',
  IMPLEMENTOS: 'Inspección de implementos',
};

export const PROVEEDOR_AFEX = 'Jhon May';

// Banderas del equipo que habilitan controles adicionales (además de GENERAL), con su
// etiqueta para el formulario/tabla de Equipos. Deben coincidir con CONTROLES_POR_BANDERA
// en core/estado.js — agregar un control nuevo basado en una característica del equipo
// implica un renglón aquí y otro ahí, nada más.
export const BANDERAS_EQUIPO = [
  { clave: 'afex', etiqueta: 'AFEX' },
  { clave: 'rodajes', etiqueta: 'Rodajes' },
  { clave: 'baldes', etiqueta: 'Baldes' },
  { clave: 'implementos', etiqueta: 'Implementos' },
];

// A qué equipos aplica cada control (para la pantalla de Configuración).
export const APLICA_A_POR_CONTROL = {
  GENERAL: 'Toda la flota',
  AFEX_INSP: 'Equipos con AFEX',
  AFEX_MANT: 'Equipos con AFEX',
  AFEX_CERT: 'Equipos con AFEX',
  RODAJES: 'Equipos con Rodajes',
  BALDES: 'Equipos con Baldes',
  IMPLEMENTOS: 'Equipos con Implementos',
};

export const UBICACIONES = ['Volcán', 'Mojón', 'Acarreo', 'Troja', 'Taller'];

export const RESULTADOS = ['Sin hallazgos', 'Con hallazgos', 'Equipo fuera de servicio'];

export const COLOR_ESTADO = {
  'AL DÍA': { fondo: '#E3F4E8', texto: '#1E7B34', grafico: '#2E9E4F' },
  PROGRAMAR: { fondo: '#FFF3D6', texto: '#8A5A00', grafico: '#E8A317' },
  VENCIDA: { fondo: '#FDE4E4', texto: '#B42318', grafico: '#D14343' },
  'SIN REGISTRO': { fondo: '#EEF0F3', texto: '#5B6472', grafico: '#A3AAB5' },
};
