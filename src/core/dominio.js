// Constantes del dominio (ESPECIFICACION.md secciones 3.1 y 3.2). No tienen lógica, solo datos fijos.

export const FLOTAS = {
  CAT: 'NIMAC – Caterpillar',
  KOMATSU: 'Construmarket – Komatsu',
  VOLQUETES: 'Acarreo – Volquetes',
  AUXILIAR: 'Flota auxiliar',
};

// Carpeta destino dentro de INSPECCIONES/, agrupada por tipo de inspección (quién inspecciona),
// no por flota: "INSPECCIONES NIMAC", "INSPECCIONES CONSTRUMARKET", "INSPECCIONES AFEX"…
// Los controles AFEX siempre van a su propia carpeta, sin importar la flota del equipo.
// Sin guion largo "–" en los nombres de carpeta (algunos sincronizadores de Drive no los listan bien).
export function carpetaTipoInspeccion(equipo, tipo) {
  if (tipo !== 'GENERAL') return 'INSPECCIONES AFEX';
  const proveedor = (equipo.proveedor || '').trim() || equipo.flota;
  return 'INSPECCIONES ' + proveedor.toUpperCase();
}

export const CONTROLES_NOMBRE = {
  GENERAL: 'Inspección general',
  AFEX_INSP: 'AFEX – Inspección',
  AFEX_MANT: 'AFEX – Mantenimiento',
  AFEX_CERT: 'AFEX – Recertificación',
};

export const PROVEEDOR_AFEX = 'Jhon May';

export const UBICACIONES = ['Volcán', 'Mojón', 'Acarreo', 'Troja', 'Taller'];

export const RESULTADOS = ['Sin hallazgos', 'Con hallazgos', 'Equipo fuera de servicio'];

export const COLOR_ESTADO = {
  'AL DÍA': { fondo: '#E3F4E8', texto: '#1E7B34', grafico: '#2E9E4F' },
  PROGRAMAR: { fondo: '#FFF3D6', texto: '#8A5A00', grafico: '#E8A317' },
  VENCIDA: { fondo: '#FDE4E4', texto: '#B42318', grafico: '#D14343' },
  'SIN REGISTRO': { fondo: '#EEF0F3', texto: '#5B6472', grafico: '#A3AAB5' },
};
