import { describe, it, expect } from 'vitest';
import { segmentosRutaAdjuntos, limpiarNombre } from './dominio.js';

describe('limpiarNombre', () => {
  it('reemplaza caracteres no permitidos en nombres de carpeta/archivo', () => {
    expect(limpiarNombre('A/B:C*D?E"F<G>H|I')).toBe('A-B-C-D-E-F-G-H-I');
  });
});

describe('segmentosRutaAdjuntos — ruta de Drive para los adjuntos (Etapa 2)', () => {
  it('equipo GENERAL con proveedor: INSPECCIONES/<PROVEEDOR>/<mes>/<codigo>', () => {
    const equipo = { codigo: '518', proveedor: 'NIMAC', flota: 'CAT' };
    expect(segmentosRutaAdjuntos(equipo, 'GENERAL', '2026-11-04')).toEqual(['INSPECCIONES', 'INSPECCIONES NIMAC', '2026-11', '518']);
  });

  it('control AFEX siempre va a INSPECCIONES AFEX, sin importar el proveedor del equipo', () => {
    const equipo = { codigo: '568', proveedor: 'NIMAC', flota: 'CAT' };
    expect(segmentosRutaAdjuntos(equipo, 'AFEX_MANT', '2026-11-04')).toEqual(['INSPECCIONES', 'INSPECCIONES AFEX', '2026-11', '568']);
  });

  it('equipo sin proveedor usa el nombre de la flota como respaldo', () => {
    const equipo = { codigo: '50-194', proveedor: '', flota: 'VOLQUETES' };
    expect(segmentosRutaAdjuntos(equipo, 'GENERAL', '2026-01-15')).toEqual(['INSPECCIONES', 'INSPECCIONES VOLQUETES', '2026-01', '50-194']);
  });
});
