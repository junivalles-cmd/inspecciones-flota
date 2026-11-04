// Exportar a CSV (separador ";", UTF-8 con BOM para que Excel lo abra bien con tildes).
export function exportarCSV(nombreArchivo, encabezados, filas) {
  const texto = '﻿' + [encabezados, ...filas]
    .map((fila) => fila.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';'))
    .join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv' }));
  a.download = nombreArchivo;
  a.click();
}
