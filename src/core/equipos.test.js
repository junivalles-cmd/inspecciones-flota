import { describe, it, expect } from 'vitest';
import { siguienteIdEquipo, buscarEquipoPorCodigo, codigosEnUso } from './equipos.js';

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
