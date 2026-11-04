// Núcleo de cálculo de estado de inspecciones (ESPECIFICACION.md, sección 3.3).
// Módulo puro: no toca DOM, localStorage ni el sistema de archivos.

export const CONTROLES = ['GENERAL', 'AFEX_INSP', 'AFEX_MANT', 'AFEX_CERT'];

export const CONFIG_DEFAULT = {
  GENERAL: { frecuencia_dias: 30, anticipacion_dias: 10 },
  AFEX_INSP: { frecuencia_dias: 30, anticipacion_dias: 10 },
  AFEX_MANT: { frecuencia_dias: 90, anticipacion_dias: 15 },
  AFEX_CERT: { frecuencia_dias: 365, anticipacion_dias: 30 },
};

export const ESTADOS = ['VENCIDA', 'PROGRAMAR', 'SIN REGISTRO', 'AL DÍA'];
export const ORDEN_ESTADO = { VENCIDA: 0, PROGRAMAR: 1, 'SIN REGISTRO': 2, 'AL DÍA': 3 };
const PRIORIDAD_PEOR = { VENCIDA: 0, 'SIN REGISTRO': 1, PROGRAMAR: 2, 'AL DÍA': 3 };

export function inicioDelDia(d = new Date()) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatearISO(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Acepta frecuencia_dias/anticipacion_dias (nombres nuevos) o f/a (v1), con respaldo en CONFIG_DEFAULT.
export function normalizarConfig(raw) {
  const out = {};
  for (const tipo of CONTROLES) {
    const c = (raw && raw[tipo]) || {};
    out[tipo] = {
      frecuencia_dias: Number(c.frecuencia_dias ?? c.f ?? CONFIG_DEFAULT[tipo].frecuencia_dias),
      anticipacion_dias: Number(c.anticipacion_dias ?? c.a ?? CONFIG_DEFAULT[tipo].anticipacion_dias),
    };
  }
  return out;
}

export function tiposAplicables(equipo) {
  return equipo.afex ? [...CONTROLES] : ['GENERAL'];
}

// Se agrupa por equipoId (el id oculto del equipo), no por código: el código es
// editable (ESPECIFICACION.md 3.4.5) y no puede ser la llave de enlace con el historial.
export function ultimasInspecciones(inspecciones) {
  const last = {};
  for (const i of inspecciones) {
    const k = i.equipoId + '|' + i.tipo;
    if (!last[k] || i.fecha > last[k].fecha) last[k] = i;
  }
  return last;
}

// Regla de estado para un (equipo, control) — sección 3.3.
export function calcularControl(ultimaFecha, frecuenciaDias, anticipacionDias, hoy = inicioDelDia()) {
  if (!ultimaFecha) {
    return { proxima: null, dias: null, estado: 'SIN REGISTRO' };
  }
  const p = parseISO(ultimaFecha);
  p.setDate(p.getDate() + Number(frecuenciaDias));
  const proxima = formatearISO(p);
  const dias = Math.round((p - hoy) / 86400000);
  const estado = dias < 0 ? 'VENCIDA' : dias <= Number(anticipacionDias) ? 'PROGRAMAR' : 'AL DÍA';
  return { proxima, dias, estado };
}

// Genera una fila por cada (equipo activo, control aplicable).
export function calcularControles(equipos, inspecciones, configRaw, hoy = inicioDelDia()) {
  const config = normalizarConfig(configRaw);
  const last = ultimasInspecciones(inspecciones);
  const rows = [];
  for (const e of equipos) {
    if (e.activo === false) continue;
    for (const tipo of tiposAplicables(e)) {
      const cfg = config[tipo];
      const l = last[e.id + '|' + tipo];
      const { proxima, dias, estado } = calcularControl(l ? l.fecha : null, cfg.frecuencia_dias, cfg.anticipacion_dias, hoy);
      rows.push({
        equipo: e,
        tipo,
        ultima: l ? l.fecha : '',
        proxima,
        dias,
        estado,
        proveedor: tipo === 'GENERAL' ? e.proveedor : 'Jhon May',
      });
    }
  }
  return rows;
}

export function ordenarControles(rows) {
  return [...rows].sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || (a.dias ?? 9e9) - (b.dias ?? 9e9) || a.equipo.codigo.localeCompare(b.equipo.codigo)
  );
}

export function conteoPorEstado(rows) {
  const c = { 'AL DÍA': 0, PROGRAMAR: 0, VENCIDA: 0, 'SIN REGISTRO': 0 };
  for (const r of rows) c[r.estado]++;
  return c;
}

// % al día de un grupo = (AL DÍA + PROGRAMAR) / total.
export function porcentajeAlDia(rows) {
  if (!rows.length) return 0;
  const n = rows.filter((r) => r.estado === 'AL DÍA' || r.estado === 'PROGRAMAR').length;
  return Math.round((n / rows.length) * 100);
}

// Estado general de un equipo (para resúmenes): el peor de sus controles.
// Prioridad: VENCIDA > SIN REGISTRO > PROGRAMAR > AL DÍA.
export function estadoGeneralEquipo(rowsDelEquipo) {
  let peor = null;
  for (const r of rowsDelEquipo) {
    if (peor === null || PRIORIDAD_PEOR[r.estado] < PRIORIDAD_PEOR[peor]) peor = r.estado;
  }
  return peor;
}

export const HORIZONTE_SEMANA_DIAS = 7;
export const HORIZONTE_MES_DIAS = 30;

// Controles a programar dentro del horizonte dado (para el Excel de "semana"/"mes"):
// vencidos y sin registro siempre entran (ya necesitan atención), más los que vencen
// dentro de los próximos `horizonteDias` desde hoy — ventana móvil, no mes/semana calendario.
export function equiposParaProgramar(rows, horizonteDias) {
  return rows.filter((r) => r.estado === 'VENCIDA' || r.estado === 'SIN REGISTRO' || (r.dias !== null && r.dias <= horizonteDias));
}
