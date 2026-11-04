import { describe, it, expect } from 'vitest';
import { siguienteIdEquipo, buscarEquipoPorCodigo, codigosEnUso, migrarEquiposFaltantes, migrarInspeccionesFaltantes } from './equipos.js';

describe('siguienteIdEquipo', () => {
  it('genera E001 cuando no hay equipos', () => {
    expect(siguienteIdEquipo([])).toBe('E001');
  });

  it('continúa después del id más alto existente', () => {
    const equipos = [{ id: 'E001' }, { id: 'E005' }, { id: 'E003' }];
    expect(siguienteIdEquipo(equipos)).toBe('E006');
  });

  it('ignora ids que no siguen el patrón E###', () => {
    const equipos = [{ id: 'E001' }, { id: 'legado-x' }, { id: '' }];
    expect(siguienteIdEquipo(equipos)).toBe('E002');
  });
});

describe('buscarEquipoPorCodigo', () => {
  const equipos = [{ id: 'E001', codigo: '45-69', codigo2: 'A02' }, { id: 'E002', codigo: '518', codigo2: '' }];

  it('encuentra por el código principal', () => {
    expect(buscarEquipoPorCodigo(equipos, '45-69').id).toBe('E001');
  });

  it('encuentra por el código secundario, sin distinguir mayúsculas', () => {
    expect(buscarEquipoPorCodigo(equipos, 'a02').id).toBe('E001');
  });

  it('no encuentra nada con texto vacío', () => {
    expect(buscarEquipoPorCodigo(equipos, '')).toBeUndefined();
  });
});

describe('codigosEnUso', () => {
  const equipos = [{ id: 'E001', codigo: '45-69', codigo2: 'A02' }, { id: 'E002', codigo: '518', codigo2: '' }];

  it('detecta choque con el código principal de otro equipo', () => {
    expect(codigosEnUso(equipos, { codigo: '518', codigo2: '', idExcluido: null })).toBe(true);
  });

  it('detecta choque cruzado: el codigo2 nuevo ya es el codigo de otro', () => {
    expect(codigosEnUso(equipos, { codigo: 'nuevo', codigo2: '518', idExcluido: null })).toBe(true);
  });

  it('no choca contra sí mismo al editar', () => {
    expect(codigosEnUso(equipos, { codigo: '45-69', codigo2: 'A02', idExcluido: 'E001' })).toBe(false);
  });

  it('no choca cuando los códigos son nuevos', () => {
    expect(codigosEnUso(equipos, { codigo: '999', codigo2: 'B09', idExcluido: null })).toBe(false);
  });
});

describe('migrarEquiposFaltantes — equipos.json guardado con una versión anterior', () => {
  it('asigna id y codigo2 a equipos que no los tienen, sin tocar los que ya los tienen', () => {
    const equipos = [{ codigo: '518' }, { id: 'E005', codigo: '45-69', codigo2: 'A02' }, { codigo: '20-85' }];
    const r = migrarEquiposFaltantes(equipos);
    expect(r.cambiaron).toBe(true);
    expect(r.equipos.map((e) => e.id)).toEqual(['E006', 'E005', 'E007']);
    expect(r.equipos[0].codigo2).toBe('');
    expect(r.equipos[1]).toEqual({ id: 'E005', codigo: '45-69', codigo2: 'A02' });
  });

  it('no marca cambios si ya todos tienen id y codigo2', () => {
    const equipos = [{ id: 'E001', codigo: '518', codigo2: '' }];
    expect(migrarEquiposFaltantes(equipos).cambiaron).toBe(false);
  });
});

describe('migrarInspeccionesFaltantes — inspecciones.json guardado sin equipoId', () => {
  const equipos = [{ id: 'E001', codigo: '518', codigo2: '' }];

  it('agrega equipoId resolviendo por el código guardado en la inspección', () => {
    const r = migrarInspeccionesFaltantes([{ codigo: '518', tipo: 'GENERAL' }], equipos);
    expect(r.cambiaron).toBe(true);
    expect(r.inspecciones[0].equipoId).toBe('E001');
  });

  it('deja intacto un registro que ya tiene equipoId', () => {
    const r = migrarInspeccionesFaltantes([{ codigo: '518', equipoId: 'E999', tipo: 'GENERAL' }], equipos);
    expect(r.cambiaron).toBe(false);
    expect(r.inspecciones[0].equipoId).toBe('E999');
  });

  it('deja sin equipoId lo que no encuentra equipo (código ya no existe)', () => {
    const r = migrarInspeccionesFaltantes([{ codigo: 'fantasma', tipo: 'GENERAL' }], equipos);
    expect(r.cambiaron).toBe(false);
    expect(r.inspecciones[0].equipoId).toBeUndefined();
  });
});
