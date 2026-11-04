// Identidad de equipos (ESPECIFICACION.md 3.4.5): un id interno oculto e inmutable
// (p. ej. "E001"), distinto de los dos códigos visibles y editables (codigo, codigo2).
// Módulo puro: no toca DOM ni almacenamiento.

const PATRON_ID = /^E(\d+)$/;

export function siguienteIdEquipo(equipos) {
  let max = 0;
  for (const e of equipos) {
    const m = PATRON_ID.exec(e.id || '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return 'E' + String(max + 1).padStart(3, '0');
}

export function buscarEquipoPorId(equipos, id) {
  return equipos.find((e) => e.id === id);
}

// Coincide por codigo o por codigo2 (ambos editables por el usuario).
export function buscarEquipoPorCodigo(equipos, texto) {
  const q = String(texto).trim().toLowerCase();
  if (!q) return undefined;
  return equipos.find((e) => e.codigo.toLowerCase() === q || (e.codigo2 && e.codigo2.toLowerCase() === q));
}

// true si codigo/codigo2 (no vacíos) ya los usa otro equipo, en cualquier combinación,
// sin distinguir mayúsculas (p. ej. no se permite que el codigo2 de uno sea igual al
// codigo de otro).
export function codigosEnUso(equipos, { codigo, codigo2, idExcluido }) {
  const nuevos = [codigo, codigo2].filter(Boolean).map((s) => s.trim().toLowerCase());
  return equipos.some((e) => {
    if (e.id === idExcluido) return false;
    const existentes = [e.codigo, e.codigo2].filter(Boolean).map((s) => s.toLowerCase());
    return nuevos.some((n) => existentes.includes(n));
  });
}

// Migración perezosa: equipos.json guardado con una versión anterior (antes de que
// existiera el id oculto / codigo2) no tiene esos campos. Sin esto, el id llega
// undefined y "Editar" no encuentra el equipo (abre el formulario como si fuera
// "Agregar"). Se le asigna un id nuevo basado en los que ya existan, sin tocar nada más.
export function migrarEquiposFaltantes(equipos) {
  let cambiaron = false;
  let proximoId = null;
  const resultado = equipos.map((e) => {
    let nuevo = e;
    if (nuevo.codigo2 === undefined) {
      nuevo = { ...nuevo, codigo2: '' };
      cambiaron = true;
    }
    if (!nuevo.id) {
      if (proximoId === null) proximoId = siguienteIdEquipo(equipos);
      nuevo = { ...nuevo, id: proximoId };
      proximoId = 'E' + String(Number(proximoId.slice(1)) + 1).padStart(3, '0');
      cambiaron = true;
    }
    return nuevo;
  });
  return { equipos: resultado, cambiaron };
}

// Mismo caso para inspecciones.json guardadas antes de que existiera equipoId:
// se resuelve buscando el equipo por el código que quedó guardado en ese momento.
export function migrarInspeccionesFaltantes(inspecciones, equipos) {
  let cambiaron = false;
  const resultado = inspecciones.map((i) => {
    if (i.equipoId) return i;
    const eq = buscarEquipoPorCodigo(equipos, i.codigo);
    if (!eq) return i;
    cambiaron = true;
    return { ...i, equipoId: eq.id };
  });
  return { inspecciones: resultado, cambiaron };
}
