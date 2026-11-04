import { describe, it, expect } from 'vitest';
import { calcularControl, formatearISO, inicioDelDia, equiposParaProgramar, tiposAplicables, calcularControles } from './estado.js';

// "hoy" fijo para que las pruebas no dependan de la fecha real de ejecución.
const HOY = inicioDelDia(new Date(2026, 10, 4)); // 04/11/2026

function hace(dias) {
  const d = new Date(HOY);
  d.setDate(d.getDate() - dias);
  return formatearISO(d);
}

describe('calcularControl — ESPECIFICACION.md sección 8, casos 2 a 5', () => {
  it('caso 2: equipo sin inspección previa, se registra con fecha de hoy → AL DÍA, próxima = hoy + 30, días = 30', () => {
    const ultima = formatearISO(HOY);
    const r = calcularControl(ultima, 30, 10, HOY);
    expect(r.estado).toBe('AL DÍA');
    expect(r.dias).toBe(30);
    expect(r.proxima).toBe(formatearISO(new Date(2026, 11, 4)));
  });

  it('caso 3: inspección de hace 25 días (frecuencia 30, aviso 10) → días = 5 → PROGRAMAR', () => {
    const r = calcularControl(hace(25), 30, 10, HOY);
    expect(r.dias).toBe(5);
    expect(r.estado).toBe('PROGRAMAR');
  });

  it('caso 4: inspección de hace 31 días (frecuencia 30) → días = -1 → VENCIDA', () => {
    const r = calcularControl(hace(31), 30, 10, HOY);
    expect(r.dias).toBe(-1);
    expect(r.estado).toBe('VENCIDA');
  });

  it('caso 5: 45-80, última inspección general 29/08/2025 → VENCIDA, con más de 400 días de atraso', () => {
    const r = calcularControl('2025-08-29', 30, 10, HOY);
    expect(r.estado).toBe('VENCIDA');
    expect(-r.dias).toBeGreaterThan(400);
  });

  it('sin última inspección → SIN REGISTRO, próxima y días nulos', () => {
    const r = calcularControl(null, 30, 10, HOY);
    expect(r.estado).toBe('SIN REGISTRO');
    expect(r.proxima).toBeNull();
    expect(r.dias).toBeNull();
  });
});

describe('equiposParaProgramar — filtro del Excel de programación semanal/mensual', () => {
  const filas = [
    { estado: 'VENCIDA', dias: -5 },
    { estado: 'SIN REGISTRO', dias: null },
    { estado: 'PROGRAMAR', dias: 5 },
    { estado: 'AL DÍA', dias: 20 },
    { estado: 'AL DÍA', dias: 29 },
  ];

  it('horizonte de 7 días: incluye vencidas, sin registro y lo que vence en ≤7 días', () => {
    const r = equiposParaProgramar(filas, 7);
    expect(r).toHaveLength(3);
    expect(r.map((x) => x.estado)).toEqual(['VENCIDA', 'SIN REGISTRO', 'PROGRAMAR']);
  });

  it('horizonte de 30 días: también incluye lo que vence dentro del mes', () => {
    const r = equiposParaProgramar(filas, 30);
    expect(r).toHaveLength(5);
  });
});

describe('tiposAplicables — controles por bandera del equipo (AFEX, Rodajes, Baldes, Implementos)', () => {
  it('un equipo sin ninguna bandera solo tiene GENERAL', () => {
    expect(tiposAplicables({})).toEqual(['GENERAL']);
  });

  it('afex agrega los 3 controles AFEX', () => {
    expect(tiposAplicables({ afex: true })).toEqual(['GENERAL', 'AFEX_INSP', 'AFEX_MANT', 'AFEX_CERT']);
  });

  it('un tractor con rodajes e implementos, sin AFEX ni baldes', () => {
    expect(tiposAplicables({ rodajes: true, implementos: true })).toEqual(['GENERAL', 'RODAJES', 'IMPLEMENTOS']);
  });

  it('una excavadora con AFEX, rodajes y baldes', () => {
    expect(tiposAplicables({ afex: true, rodajes: true, baldes: true })).toEqual([
      'GENERAL',
      'AFEX_INSP',
      'AFEX_MANT',
      'AFEX_CERT',
      'RODAJES',
      'BALDES',
    ]);
  });
});

describe('calcularControles — proveedor correcto para controles nuevos (no deben salir como AFEX/Jhon May)', () => {
  const hoy = inicioDelDia(new Date(2026, 10, 4));
  const equipos = [{ id: 'E001', codigo: '568', proveedor: 'NIMAC', activo: true, rodajes: true, baldes: true }];

  it('RODAJES y BALDES usan el proveedor del equipo, no Jhon May', () => {
    const rows = calcularControles(equipos, [], {}, hoy);
    const rodajes = rows.find((r) => r.tipo === 'RODAJES');
    const baldes = rows.find((r) => r.tipo === 'BALDES');
    expect(rodajes.proveedor).toBe('NIMAC');
    expect(baldes.proveedor).toBe('NIMAC');
  });
});
